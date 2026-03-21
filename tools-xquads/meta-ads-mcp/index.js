import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import dotenv from "dotenv";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { readFileSync, existsSync } from "fs";

const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, ".env") });

const API_VERSION = "v21.0";
const BASE_URL = `https://graph.facebook.com/${API_VERSION}`;
const ACCESS_TOKEN = process.env.META_ACCESS_TOKEN;
const DEFAULT_ACCOUNT_ID = process.env.META_AD_ACCOUNT_ID;

// --- Multi-Account Support ---

let accountsConfig = { accounts: [], default_account: null };
const accountsPath = resolve(__dirname, "accounts.json");
if (existsSync(accountsPath)) {
  accountsConfig = JSON.parse(readFileSync(accountsPath, "utf-8"));
}

function resolveAccountId(aliasOrId) {
  if (!aliasOrId) {
    // Use default from accounts.json or .env
    if (accountsConfig.default_account) {
      const def = accountsConfig.accounts.find(a => a.alias === accountsConfig.default_account);
      if (def) return def.account_id;
    }
    return DEFAULT_ACCOUNT_ID;
  }
  // Check if it's an alias
  const byAlias = accountsConfig.accounts.find(a => a.alias === aliasOrId);
  if (byAlias) return byAlias.account_id;
  // Otherwise treat as raw account ID
  return aliasOrId;
}

function accountPath(aliasOrId) {
  return `act_${resolveAccountId(aliasOrId)}`;
}

async function metaApi(endpoint, params = {}, method = "GET") {
  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("access_token", ACCESS_TOKEN);

  const opts = { method };
  if (method === "GET") {
    for (const [k, v] of Object.entries(params)) {
      url.searchParams.set(k, v);
    }
  } else {
    opts.headers = { "Content-Type": "application/x-www-form-urlencoded" };
    const body = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      body.set(k, v);
    }
    opts.body = body.toString();
  }

  const res = await fetch(url.toString(), opts);
  const data = await res.json();
  if (data.error) {
    const details = data.error.error_user_title ? ` | ${data.error.error_user_title}: ${data.error.error_user_msg}` : '';
    const subcode = data.error.error_subcode ? ` subcode: ${data.error.error_subcode}` : '';
    const fbtrace = data.error.fbtrace_id ? ` trace: ${data.error.fbtrace_id}` : '';
    throw new Error(`Meta API Error: ${data.error.message} (code: ${data.error.code}${subcode})${details}${fbtrace}`);
  }
  return data;
}

// --- Account ID param reused across tools ---
const accountParam = z.string().optional().describe("Account alias or ID. Omit for default account. Use meta_list_accounts to see available accounts.");

// --- MCP Server ---

const server = new McpServer({
  name: "meta-ads-mcp",
  version: "1.1.0",
  description: "Meta Marketing API — Facebook & Instagram Ads (multi-account)",
});

// --- Multi-Account Tools ---

server.tool(
  "meta_list_accounts",
  "List all configured ad accounts with aliases",
  {},
  async () => {
    const configured = accountsConfig.accounts.map(a => ({
      alias: a.alias,
      account_id: a.account_id,
      name: a.name,
      notes: a.notes || "",
      is_default: a.alias === accountsConfig.default_account,
    }));

    if (configured.length === 0) {
      return {
        content: [{
          type: "text",
          text: `No accounts.json found. Using .env default: act_${DEFAULT_ACCOUNT_ID}\n\nTo configure multiple accounts, create accounts.json (see accounts.example.json)`,
        }],
      };
    }

    return { content: [{ type: "text", text: JSON.stringify(configured, null, 2) }] };
  }
);

server.tool(
  "meta_get_account",
  "Get ad account info and spending limits",
  { account: accountParam },
  async ({ account }) => {
    const data = await metaApi(accountPath(account), {
      fields: "name,account_id,account_status,currency,timezone_name,amount_spent,balance,spend_cap,business_name,business_city,business_country_code",
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_get_campaigns",
  "List campaigns with status and metrics",
  {
    account: accountParam,
    status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED", "ALL"]).default("ALL").describe("Filter by status"),
    limit: z.number().default(25).describe("Max results"),
  },
  async ({ account, status, limit }) => {
    const params = {
      fields: "name,objective,status,daily_budget,lifetime_budget,budget_remaining,start_time,stop_time,created_time,updated_time",
      limit: String(limit),
    };
    if (status !== "ALL") {
      params.filtering = JSON.stringify([{ field: "effective_status", operator: "IN", value: [status] }]);
    }
    const data = await metaApi(`${accountPath(account)}/campaigns`, params);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_get_adsets",
  "List ad sets with targeting and budget info",
  {
    account: accountParam,
    campaign_id: z.string().optional().describe("Filter by campaign ID"),
    status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED", "ALL"]).default("ALL").describe("Filter by status"),
    limit: z.number().default(25).describe("Max results"),
  },
  async ({ account, campaign_id, status, limit }) => {
    const endpoint = campaign_id ? `${campaign_id}/adsets` : `${accountPath(account)}/adsets`;
    const params = {
      fields: "name,campaign_id,status,daily_budget,lifetime_budget,bid_amount,billing_event,optimization_goal,targeting,start_time,end_time",
      limit: String(limit),
    };
    if (status !== "ALL") {
      params.filtering = JSON.stringify([{ field: "effective_status", operator: "IN", value: [status] }]);
    }
    const data = await metaApi(endpoint, params);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_get_ads",
  "List ads with creative info",
  {
    account: accountParam,
    adset_id: z.string().optional().describe("Filter by ad set ID"),
    campaign_id: z.string().optional().describe("Filter by campaign ID"),
    status: z.enum(["ACTIVE", "PAUSED", "ARCHIVED", "ALL"]).default("ALL").describe("Filter by status"),
    limit: z.number().default(25).describe("Max results"),
  },
  async ({ account, adset_id, campaign_id, status, limit }) => {
    let endpoint = `${accountPath(account)}/ads`;
    if (adset_id) endpoint = `${adset_id}/ads`;
    else if (campaign_id) endpoint = `${campaign_id}/ads`;

    const params = {
      fields: "name,adset_id,campaign_id,status,creative{title,body,image_url,thumbnail_url,link_url,call_to_action_type},created_time",
      limit: String(limit),
    };
    if (status !== "ALL") {
      params.filtering = JSON.stringify([{ field: "effective_status", operator: "IN", value: [status] }]);
    }
    const data = await metaApi(endpoint, params);
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_get_insights",
  "Get performance metrics (spend, impressions, clicks, conversions, ROAS)",
  {
    account: accountParam,
    object_id: z.string().optional().describe("Campaign, adset, or ad ID. Omit for account-level"),
    date_preset: z.enum([
      "today", "yesterday", "this_month", "last_month",
      "last_3d", "last_7d", "last_14d", "last_28d", "last_30d", "last_90d",
      "maximum",
    ]).default("last_7d").describe("Date range preset"),
    time_increment: z.enum(["1", "7", "28", "monthly", "all_days"]).default("1").describe("Break down by day(1), week(7), month"),
    level: z.enum(["account", "campaign", "adset", "ad"]).default("campaign").describe("Aggregation level"),
    limit: z.number().default(50).describe("Max results"),
  },
  async ({ account, object_id, date_preset, time_increment, level, limit }) => {
    const endpoint = object_id ? `${object_id}/insights` : `${accountPath(account)}/insights`;
    const data = await metaApi(endpoint, {
      fields: "campaign_name,adset_name,ad_name,spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,cost_per_action_type,purchase_roas,conversions,cost_per_conversion",
      date_preset,
      time_increment,
      level,
      limit: String(limit),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_get_audiences",
  "List custom audiences",
  {
    account: accountParam,
    limit: z.number().default(25).describe("Max results"),
  },
  async ({ account, limit }) => {
    const data = await metaApi(`${accountPath(account)}/customaudiences`, {
      fields: "name,description,approximate_count,data_source,delivery_status,operation_status,subtype",
      limit: String(limit),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_create_campaign",
  "Create a new campaign",
  {
    account: accountParam,
    name: z.string().describe("Campaign name"),
    objective: z.enum([
      "OUTCOME_AWARENESS", "OUTCOME_ENGAGEMENT", "OUTCOME_LEADS",
      "OUTCOME_SALES", "OUTCOME_TRAFFIC", "OUTCOME_APP_PROMOTION",
    ]).describe("Campaign objective"),
    daily_budget: z.number().optional().describe("Daily budget in cents (e.g., 5000 = $50)"),
    lifetime_budget: z.number().optional().describe("Lifetime budget in cents"),
    status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED").describe("Initial status"),
    special_ad_categories: z.array(z.string()).default([]).describe("Special ad categories if applicable"),
  },
  async ({ account, name, objective, daily_budget, lifetime_budget, status, special_ad_categories }) => {
    const body = { name, objective, status, special_ad_categories };
    if (daily_budget) body.daily_budget = daily_budget;
    if (lifetime_budget) body.lifetime_budget = lifetime_budget;

    const params = {};
    for (const [k, v] of Object.entries(body)) {
      params[k] = typeof v === "object" ? JSON.stringify(v) : String(v);
    }

    const data = await metaApi(`${accountPath(account)}/campaigns`, params, "POST");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_create_adset",
  "Create a new ad set within a campaign",
  {
    account: accountParam,
    name: z.string().describe("Ad set name"),
    campaign_id: z.string().describe("Parent campaign ID"),
    daily_budget: z.number().optional().describe("Daily budget in cents"),
    lifetime_budget: z.number().optional().describe("Lifetime budget in cents"),
    billing_event: z.enum(["IMPRESSIONS", "LINK_CLICKS", "THRUPLAY"]).default("IMPRESSIONS"),
    optimization_goal: z.enum([
      "REACH", "IMPRESSIONS", "LINK_CLICKS", "LANDING_PAGE_VIEWS",
      "LEAD_GENERATION", "OFFSITE_CONVERSIONS", "CONVERSIONS", "VALUE",
    ]).describe("Optimization goal"),
    targeting: z.string().describe("Targeting spec as JSON string (e.g., {\"geo_locations\":{\"countries\":[\"BR\"]},\"age_min\":25,\"age_max\":55})"),
    promoted_object: z.string().optional().describe("Promoted object as JSON string (e.g., {\"pixel_id\":\"123\",\"custom_event_type\":\"LEAD\"})"),
    start_time: z.string().optional().describe("ISO 8601 start time"),
    end_time: z.string().optional().describe("ISO 8601 end time (required for lifetime budget)"),
    status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
  },
  async ({ account, name, campaign_id, daily_budget, lifetime_budget, billing_event, optimization_goal, targeting, promoted_object, start_time, end_time, status }) => {
    const params = {
      name, campaign_id, billing_event, optimization_goal,
      targeting, status,
    };
    if (daily_budget) params.daily_budget = String(daily_budget);
    if (lifetime_budget) params.lifetime_budget = String(lifetime_budget);
    if (promoted_object) params.promoted_object = promoted_object;
    if (start_time) params.start_time = start_time;
    if (end_time) params.end_time = end_time;

    const data = await metaApi(`${accountPath(account)}/adsets`, params, "POST");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_create_ad",
  "Create a new ad within an ad set",
  {
    account: accountParam,
    name: z.string().describe("Ad name"),
    adset_id: z.string().describe("Parent ad set ID"),
    creative_id: z.string().optional().describe("Existing creative ID"),
    creative_spec: z.string().optional().describe("Creative spec as JSON string for inline creative creation"),
    status: z.enum(["ACTIVE", "PAUSED"]).default("PAUSED"),
  },
  async ({ account, name, adset_id, creative_id, creative_spec, status }) => {
    const params = { name, adset_id, status };
    if (creative_id) {
      params.creative = JSON.stringify({ creative_id });
    } else if (creative_spec) {
      params.creative = creative_spec;
    }
    const data = await metaApi(`${accountPath(account)}/ads`, params, "POST");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_update_object",
  "Update a campaign, ad set, or ad (status, budget, name, targeting, etc.)",
  {
    object_id: z.string().describe("ID of the campaign, ad set, or ad to update"),
    updates: z.string().describe("JSON string of fields to update (e.g., {\"status\":\"PAUSED\",\"daily_budget\":\"10000\"})"),
  },
  async ({ object_id, updates }) => {
    const params = JSON.parse(updates);
    const data = await metaApi(object_id, params, "POST");
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_get_ad_creatives",
  "List ad creatives in the account",
  {
    account: accountParam,
    limit: z.number().default(25).describe("Max results"),
  },
  async ({ account, limit }) => {
    const data = await metaApi(`${accountPath(account)}/adcreatives`, {
      fields: "name,title,body,image_url,thumbnail_url,link_url,call_to_action_type,object_story_spec,status",
      limit: String(limit),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_get_pixel",
  "Get pixel info and recent events",
  {
    account: accountParam,
    pixel_id: z.string().optional().describe("Pixel ID. Omit to list all pixels"),
  },
  async ({ account, pixel_id }) => {
    if (pixel_id) {
      const data = await metaApi(pixel_id, {
        fields: "name,id,code,last_fired_time,is_created_by_business,data_use_setting",
      });
      return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
    }
    const data = await metaApi(`${accountPath(account)}/adspixels`, {
      fields: "name,id,last_fired_time,is_created_by_business",
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

server.tool(
  "meta_targeting_search",
  "Search for valid targeting options (interests, work positions, education, employers, etc.)",
  {
    query: z.string().describe("Search term (e.g., 'Advogado', 'Direito tributário', 'OAB')"),
    type: z.enum([
      "adinterest", "adinterestsuggestion", "adinterestvalid",
      "adTargetingCategory", "adworkposition", "adworkemployer",
      "adeducationschool", "adeducationmajor", "adlocale",
    ]).default("adinterest").describe("Type of targeting to search"),
    limit: z.number().default(10).describe("Max results"),
  },
  async ({ query, type, limit }) => {
    const data = await metaApi(`search`, {
      q: query,
      type,
      limit: String(limit),
    });
    return { content: [{ type: "text", text: JSON.stringify(data, null, 2) }] };
  }
);

// --- Start ---

async function main() {
  if (!ACCESS_TOKEN) {
    console.error("ERROR: META_ACCESS_TOKEN must be set in .env");
    process.exit(1);
  }
  if (!DEFAULT_ACCOUNT_ID && accountsConfig.accounts.length === 0) {
    console.error("ERROR: Set META_AD_ACCOUNT_ID in .env or configure accounts.json");
    process.exit(1);
  }
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
