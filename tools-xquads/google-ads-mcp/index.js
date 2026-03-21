import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { GoogleAdsApi, enums, ResourceNames } from "google-ads-api";
import { z } from "zod";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });

const MCC_CUSTOMER_ID = process.env.GOOGLE_CUSTOMER_ID;
const LOGIN_CUSTOMER_ID = process.env.GOOGLE_LOGIN_CUSTOMER_ID || MCC_CUSTOMER_ID;

// --- Google Ads Client ---

const googleAdsClient = new GoogleAdsApi({
  client_id: process.env.GOOGLE_CLIENT_ID,
  client_secret: process.env.GOOGLE_CLIENT_SECRET,
  developer_token: process.env.GOOGLE_DEVELOPER_TOKEN,
});

function getCustomer(customerId) {
  return googleAdsClient.Customer({
    customer_id: customerId || MCC_CUSTOMER_ID,
    login_customer_id: LOGIN_CUSTOMER_ID,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
  });
}

async function query(gaql, customerId) {
  try {
    const customer = getCustomer(customerId);
    return await customer.query(gaql);
  } catch (err) {
    const msg = err?.errors?.[0]?.message || err?.message || JSON.stringify(err);
    throw new Error(`Google Ads query failed (customer ${customerId || MCC_CUSTOMER_ID}): ${msg}`);
  }
}

async function mutate(customerId, resource, operations) {
  try {
    const customer = getCustomer(customerId);
    return await customer.mutateResources(operations);
  } catch (err) {
    const msg = err?.errors?.[0]?.message || err?.message || JSON.stringify(err);
    throw new Error(`Google Ads mutate failed (customer ${customerId || MCC_CUSTOMER_ID}): ${msg}`);
  }
}

// --- OAuth token helper ---

async function getAccessToken() {
  const resp = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
      grant_type: "refresh_token",
    }),
  });
  const data = await resp.json();
  if (!data.access_token) throw new Error(`OAuth failed: ${JSON.stringify(data)}`);
  return data.access_token;
}

async function restMutate(customerId, operations) {
  const accessToken = await getAccessToken();
  const resp = await fetch(
    `https://googleads.googleapis.com/v23/customers/${customerId}/googleAds:mutate`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "developer-token": process.env.GOOGLE_DEVELOPER_TOKEN,
        "login-customer-id": LOGIN_CUSTOMER_ID,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ mutateOperations: operations }),
    }
  );
  const data = await resp.json();
  if (data.error) {
    const details = data.error.details?.[0]?.errors?.map(e => ({
      message: e.message,
      errorCode: e.errorCode,
      trigger: e.trigger?.stringValue,
      location: e.location?.fieldPathElements?.map(f => f.fieldName).join('.'),
    })) || [{ message: data.error.message }];
    throw new Error(JSON.stringify(details, null, 2));
  }
  return data;
}

// --- Shared param ---
const customerParam = z.string().optional().describe("Google Ads Customer ID (without dashes). Omit for MCC default. Use google_list_accounts to see all accounts.");

// --- MCP Server ---

const server = new McpServer({
  name: "google-ads-mcp",
  version: "2.0.0",
  description: "Google Ads API via gRPC — Multi-account MCC (campaigns, reports, optimization)",
});

// --- Tools ---

server.tool(
  "google_list_accounts",
  "List all Google Ads accounts accessible from this MCC",
  {},
  async () => {
    const results = await query(`
      SELECT
        customer_client.id,
        customer_client.descriptive_name,
        customer_client.currency_code,
        customer_client.time_zone,
        customer_client.manager,
        customer_client.test_account,
        customer_client.status
      FROM customer_client
      WHERE customer_client.status = 'ENABLED'
      ORDER BY customer_client.descriptive_name
    `);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "google_get_account",
  "Get Google Ads account info for a specific account",
  { customer_id: customerParam },
  async ({ customer_id }) => {
    const results = await query(`
      SELECT
        customer.id,
        customer.descriptive_name,
        customer.currency_code,
        customer.time_zone,
        customer.manager,
        customer.test_account
      FROM customer
      LIMIT 1
    `, customer_id);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "google_get_campaigns",
  "List campaigns with status, budget, and type",
  {
    customer_id: customerParam,
    status: z.enum(["ENABLED", "PAUSED", "REMOVED", "ALL"]).default("ALL").describe("Filter by status"),
    limit: z.number().default(50).describe("Max results"),
  },
  async ({ customer_id, status, limit }) => {
    const where = status !== "ALL" ? `WHERE campaign.status = '${status}'` : "";
    const results = await query(`
      SELECT
        campaign.id,
        campaign.name,
        campaign.status,
        campaign.advertising_channel_type,
        campaign.bidding_strategy_type,
        campaign.campaign_budget,
        campaign_budget.amount_micros,
        campaign_budget.delivery_method
      FROM campaign
      ${where}
      ORDER BY campaign.name
      LIMIT ${limit}
    `, customer_id);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "google_get_ad_groups",
  "List ad groups with status and bidding info",
  {
    customer_id: customerParam,
    campaign_id: z.string().optional().describe("Filter by campaign ID"),
    status: z.enum(["ENABLED", "PAUSED", "REMOVED", "ALL"]).default("ALL"),
    limit: z.number().default(50),
  },
  async ({ customer_id, campaign_id, status, limit }) => {
    const conditions = [];
    if (campaign_id) conditions.push(`campaign.id = ${campaign_id}`);
    if (status !== "ALL") conditions.push(`ad_group.status = '${status}'`);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const results = await query(`
      SELECT
        ad_group.id,
        ad_group.name,
        ad_group.status,
        ad_group.type,
        ad_group.cpc_bid_micros,
        campaign.id,
        campaign.name
      FROM ad_group
      ${where}
      ORDER BY ad_group.name
      LIMIT ${limit}
    `, customer_id);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "google_get_ads",
  "List ads with type and creative details",
  {
    customer_id: customerParam,
    ad_group_id: z.string().optional().describe("Filter by ad group ID"),
    campaign_id: z.string().optional().describe("Filter by campaign ID"),
    status: z.enum(["ENABLED", "PAUSED", "REMOVED", "ALL"]).default("ALL"),
    limit: z.number().default(50),
  },
  async ({ customer_id, ad_group_id, campaign_id, status, limit }) => {
    const conditions = [];
    if (ad_group_id) conditions.push(`ad_group.id = ${ad_group_id}`);
    if (campaign_id) conditions.push(`campaign.id = ${campaign_id}`);
    if (status !== "ALL") conditions.push(`ad_group_ad.status = '${status}'`);
    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const results = await query(`
      SELECT
        ad_group_ad.ad.id,
        ad_group_ad.ad.name,
        ad_group_ad.ad.type,
        ad_group_ad.status,
        ad_group_ad.ad.final_urls,
        ad_group_ad.ad.responsive_search_ad.headlines,
        ad_group_ad.ad.responsive_search_ad.descriptions,
        ad_group.id,
        ad_group.name,
        campaign.id,
        campaign.name
      FROM ad_group_ad
      ${where}
      ORDER BY ad_group_ad.ad.id
      LIMIT ${limit}
    `, customer_id);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "google_get_report",
  "Get performance metrics report (clicks, impressions, cost, conversions)",
  {
    customer_id: customerParam,
    level: z.enum(["campaign", "ad_group", "ad_group_ad", "keyword"]).default("campaign").describe("Report level"),
    date_range: z.enum([
      "TODAY", "YESTERDAY", "LAST_7_DAYS", "LAST_14_DAYS",
      "LAST_30_DAYS", "THIS_MONTH", "LAST_MONTH", "LAST_90_DAYS",
    ]).default("LAST_7_DAYS").describe("Date range"),
    campaign_id: z.string().optional().describe("Filter by campaign ID"),
    order_by: z.enum(["clicks", "impressions", "cost", "conversions"]).default("cost").describe("Order by metric"),
    limit: z.number().default(50),
  },
  async ({ customer_id, level, date_range, campaign_id, order_by, limit }) => {
    const levelFields = {
      campaign: "campaign.id, campaign.name, campaign.status",
      ad_group: "campaign.id, campaign.name, ad_group.id, ad_group.name, ad_group.status",
      ad_group_ad: "campaign.name, ad_group.name, ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.ad.type",
      keyword: "campaign.name, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status",
    };

    const resource = level === "keyword" ? "keyword_view" : level;
    const orderField = `metrics.${order_by === "cost" ? "cost_micros" : order_by}`;

    const conditions = [`segments.date DURING ${date_range}`];
    if (campaign_id) conditions.push(`campaign.id = ${campaign_id}`);
    const where = `WHERE ${conditions.join(" AND ")}`;

    const results = await query(`
      SELECT
        ${levelFields[level]},
        metrics.impressions,
        metrics.clicks,
        metrics.ctr,
        metrics.average_cpc,
        metrics.cost_micros,
        metrics.conversions,
        metrics.cost_per_conversion,
        metrics.conversions_value
      FROM ${resource}
      ${where}
      ORDER BY ${orderField} DESC
      LIMIT ${limit}
    `, customer_id);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "google_get_keywords",
  "Get keyword performance and quality scores",
  {
    customer_id: customerParam,
    campaign_id: z.string().optional().describe("Filter by campaign ID"),
    status: z.enum(["ENABLED", "PAUSED", "REMOVED", "ALL"]).default("ALL"),
    limit: z.number().default(50),
  },
  async ({ customer_id, campaign_id, status, limit }) => {
    const conditions = ["ad_group_criterion.type = 'KEYWORD'"];
    if (campaign_id) conditions.push(`campaign.id = ${campaign_id}`);
    if (status !== "ALL") conditions.push(`ad_group_criterion.status = '${status}'`);
    const where = `WHERE ${conditions.join(" AND ")}`;

    const results = await query(`
      SELECT
        ad_group_criterion.keyword.text,
        ad_group_criterion.keyword.match_type,
        ad_group_criterion.status,
        ad_group_criterion.quality_info.quality_score,
        ad_group_criterion.quality_info.search_predicted_ctr,
        ad_group_criterion.quality_info.creative_quality_score,
        ad_group_criterion.quality_info.post_click_quality_score,
        ad_group.name,
        campaign.name,
        metrics.impressions,
        metrics.clicks,
        metrics.cost_micros,
        metrics.conversions
      FROM keyword_view
      ${where}
      ORDER BY metrics.impressions DESC
      LIMIT ${limit}
    `, customer_id);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

server.tool(
  "google_create_campaign",
  "Create a new campaign (creates budget + campaign in one operation)",
  {
    customer_id: customerParam,
    name: z.string().describe("Campaign name"),
    channel_type: z.enum(["SEARCH", "DISPLAY", "SHOPPING", "VIDEO", "PERFORMANCE_MAX"]).describe("Advertising channel type"),
    budget_amount_micros: z.number().describe("Daily budget in micros (e.g., 50000000 = $50)"),
    bidding_strategy: z.enum([
      "MANUAL_CPC", "MAXIMIZE_CLICKS", "MAXIMIZE_CONVERSIONS",
      "MAXIMIZE_CONVERSION_VALUE", "TARGET_CPA", "TARGET_ROAS",
    ]).default("MAXIMIZE_CLICKS").describe("Bidding strategy"),
    target_cpa_micros: z.number().optional().describe("Target CPA in micros (for TARGET_CPA)"),
    target_roas: z.number().optional().describe("Target ROAS (for TARGET_ROAS, e.g., 3.5 = 350%)"),
    status: z.enum(["ENABLED", "PAUSED"]).default("PAUSED"),
  },
  async ({ customer_id, name, channel_type, budget_amount_micros, bidding_strategy, target_cpa_micros, target_roas, status }) => {
    const cid = customer_id || MCC_CUSTOMER_ID;

    // Build bidding config (REST API uses camelCase)
    let biddingConfig = {};
    switch (bidding_strategy) {
      case "MANUAL_CPC":
        biddingConfig = { manualCpc: { enhancedCpcEnabled: true } };
        break;
      case "MAXIMIZE_CLICKS":
        biddingConfig = { maximizeClicks: {} };
        break;
      case "MAXIMIZE_CONVERSIONS":
        biddingConfig = { maximizeConversions: target_cpa_micros ? { targetCpaMicros: String(target_cpa_micros) } : {} };
        break;
      case "MAXIMIZE_CONVERSION_VALUE":
        biddingConfig = { maximizeConversionValue: target_roas ? { targetRoas: target_roas } : {} };
        break;
      case "TARGET_CPA":
        biddingConfig = { targetCpa: { targetCpaMicros: String(target_cpa_micros || 0) } };
        break;
      case "TARGET_ROAS":
        biddingConfig = { targetRoas: { targetRoas: target_roas || 0 } };
        break;
    }

    const budgetResourceName = `customers/${cid}/campaignBudgets/-1`;

    // Use REST API directly — gRPC lib missing containsEuPoliticalAdvertising field
    try {
      const result = await restMutate(cid, [
        {
          campaignBudgetOperation: {
            create: {
              resourceName: budgetResourceName,
              name: `Budget for ${name}`,
              amountMicros: String(budget_amount_micros),
              deliveryMethod: "STANDARD",
              explicitlyShared: false,
            },
          },
        },
        {
          campaignOperation: {
            create: {
              name,
              status: status,
              advertisingChannelType: channel_type,
              campaignBudget: budgetResourceName,
              containsEuPoliticalAdvertising: "DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING",
              networkSettings: {
                targetGoogleSearch: true,
                targetSearchNetwork: true,
              },
              ...biddingConfig,
            },
          },
        },
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ created: result }, null, 2) }] };
    } catch (err) {
      throw new Error(`Create campaign failed (customer ${cid}): ${err.message}`);
    }
  }
);

server.tool(
  "google_update_campaign_status",
  "Update campaign status (enable, pause, or remove)",
  {
    customer_id: customerParam,
    campaign_id: z.string().describe("Campaign ID"),
    status: z.enum(["ENABLED", "PAUSED", "REMOVED"]).describe("New status"),
  },
  async ({ customer_id, campaign_id, status }) => {
    const cid = customer_id || MCC_CUSTOMER_ID;
    const customer = getCustomer(cid);
    const statusMap = {
      ENABLED: enums.CampaignStatus.ENABLED,
      PAUSED: enums.CampaignStatus.PAUSED,
      REMOVED: enums.CampaignStatus.REMOVED,
    };

    try {
      const result = await customer.mutateResources([
        {
          entity: "campaign",
          operation: "update",
          resource: {
            resource_name: ResourceNames.campaign(cid, campaign_id),
            status: statusMap[status],
          },
        },
      ]);
      return { content: [{ type: "text", text: JSON.stringify({ updated: result }, null, 2) }] };
    } catch (err) {
      const msg = err?.errors?.[0]?.message || err?.message || JSON.stringify(err);
      throw new Error(`Update campaign failed (customer ${cid}): ${msg}`);
    }
  }
);

server.tool(
  "google_gaql_query",
  "Execute a custom GAQL (Google Ads Query Language) query for advanced reporting",
  {
    customer_id: customerParam,
    query: z.string().describe("GAQL query string (e.g., SELECT campaign.name, metrics.clicks FROM campaign WHERE campaign.status = 'ENABLED')"),
  },
  async ({ customer_id, query: gaql }) => {
    const results = await query(gaql, customer_id);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

// --- Ad Group, Keywords, RSA creation via REST API ---

server.tool(
  "google_create_ad_group",
  "Create a new ad group in a campaign",
  {
    customer_id: customerParam,
    campaign_id: z.string().describe("Campaign ID"),
    name: z.string().describe("Ad group name"),
    status: z.enum(["ENABLED", "PAUSED"]).default("PAUSED"),
    cpc_bid_micros: z.number().optional().describe("Max CPC bid in micros (optional for automated bidding)"),
  },
  async ({ customer_id, campaign_id, name, status, cpc_bid_micros }) => {
    const cid = customer_id || MCC_CUSTOMER_ID;
    try {
      const adGroup = {
        name,
        campaign: `customers/${cid}/campaigns/${campaign_id}`,
        status,
        type: "SEARCH_STANDARD",
      };
      if (cpc_bid_micros) adGroup.cpcBidMicros = String(cpc_bid_micros);

      const result = await restMutate(cid, [
        { adGroupOperation: { create: adGroup } },
      ]);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      throw new Error(`Create ad group failed (customer ${cid}): ${err.message}`);
    }
  }
);

server.tool(
  "google_create_keywords",
  "Add keywords to an ad group (batch)",
  {
    customer_id: customerParam,
    ad_group_id: z.string().describe("Ad group ID"),
    keywords: z.array(z.object({
      text: z.string().describe("Keyword text"),
      match_type: z.enum(["EXACT", "PHRASE", "BROAD"]).describe("Match type"),
    })).describe("Array of keywords to add"),
  },
  async ({ customer_id, ad_group_id, keywords }) => {
    const cid = customer_id || MCC_CUSTOMER_ID;
    try {
      const operations = keywords.map(kw => ({
        adGroupCriterionOperation: {
          create: {
            adGroup: `customers/${cid}/adGroups/${ad_group_id}`,
            status: "ENABLED",
            keyword: {
              text: kw.text,
              matchType: kw.match_type,
            },
          },
        },
      }));
      const result = await restMutate(cid, operations);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      throw new Error(`Create keywords failed (customer ${cid}): ${err.message}`);
    }
  }
);

server.tool(
  "google_create_negative_keywords",
  "Add negative keywords at campaign level (batch)",
  {
    customer_id: customerParam,
    campaign_id: z.string().describe("Campaign ID"),
    keywords: z.array(z.object({
      text: z.string().describe("Negative keyword text"),
      match_type: z.enum(["EXACT", "PHRASE", "BROAD"]).default("PHRASE"),
    })).describe("Array of negative keywords"),
  },
  async ({ customer_id, campaign_id, keywords }) => {
    const cid = customer_id || MCC_CUSTOMER_ID;
    try {
      const operations = keywords.map(kw => ({
        campaignCriterionOperation: {
          create: {
            campaign: `customers/${cid}/campaigns/${campaign_id}`,
            negative: true,
            keyword: {
              text: kw.text,
              matchType: kw.match_type,
            },
          },
        },
      }));
      const result = await restMutate(cid, operations);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      throw new Error(`Create negative keywords failed (customer ${cid}): ${err.message}`);
    }
  }
);

server.tool(
  "google_create_responsive_search_ad",
  "Create a Responsive Search Ad (RSA) in an ad group",
  {
    customer_id: customerParam,
    ad_group_id: z.string().describe("Ad group ID"),
    final_urls: z.array(z.string()).describe("Landing page URLs"),
    headlines: z.array(z.object({
      text: z.string().describe("Headline text (max 30 chars)"),
      pinned_field: z.enum(["HEADLINE_1", "HEADLINE_2", "HEADLINE_3"]).optional().describe("Pin to specific position"),
    })).describe("3-15 headlines"),
    descriptions: z.array(z.object({
      text: z.string().describe("Description text (max 90 chars)"),
      pinned_field: z.enum(["DESCRIPTION_1", "DESCRIPTION_2"]).optional().describe("Pin to specific position"),
    })).describe("2-4 descriptions"),
    path1: z.string().optional().describe("Display URL path 1 (max 15 chars)"),
    path2: z.string().optional().describe("Display URL path 2 (max 15 chars)"),
  },
  async ({ customer_id, ad_group_id, final_urls, headlines, descriptions, path1, path2 }) => {
    const cid = customer_id || MCC_CUSTOMER_ID;
    try {
      const rsa = {
        headlines: headlines.map(h => {
          const asset = { text: h.text };
          if (h.pinned_field) asset.pinnedField = h.pinned_field;
          return asset;
        }),
        descriptions: descriptions.map(d => {
          const asset = { text: d.text };
          if (d.pinned_field) asset.pinnedField = d.pinned_field;
          return asset;
        }),
      };
      if (path1) rsa.path1 = path1;
      if (path2) rsa.path2 = path2;

      const result = await restMutate(cid, [
        {
          adGroupAdOperation: {
            create: {
              adGroup: `customers/${cid}/adGroups/${ad_group_id}`,
              status: "PAUSED",
              ad: {
                finalUrls: final_urls,
                responsiveSearchAd: rsa,
              },
            },
          },
        },
      ]);
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err) {
      throw new Error(`Create RSA failed (customer ${cid}): ${err.message}`);
    }
  }
);

server.tool(
  "google_get_change_history",
  "Get recent changes made to the account",
  {
    customer_id: customerParam,
    days: z.number().default(7).describe("Number of days to look back"),
    limit: z.number().default(25),
  },
  async ({ customer_id, days, limit }) => {
    const results = await query(`
      SELECT
        change_status.resource_name,
        change_status.resource_type,
        change_status.resource_status,
        change_status.last_change_date_time,
        campaign.name,
        ad_group.name
      FROM change_status
      WHERE change_status.last_change_date_time DURING LAST_${days}_DAYS
      ORDER BY change_status.last_change_date_time DESC
      LIMIT ${limit}
    `, customer_id);
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  }
);

// --- Start ---

async function main() {
  const required = {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REFRESH_TOKEN: process.env.GOOGLE_REFRESH_TOKEN,
    GOOGLE_DEVELOPER_TOKEN: process.env.GOOGLE_DEVELOPER_TOKEN,
    GOOGLE_CUSTOMER_ID: process.env.GOOGLE_CUSTOMER_ID,
  };
  const missing = Object.entries(required).filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    console.error(`ERROR: Missing required env vars: ${missing.join(", ")}`);
    process.exit(1);
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
