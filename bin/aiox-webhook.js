#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { WebhookManager, EventSchema, EventDispatcher } = require('../.aiox-core/core/webhook-integration');

/**
 * CLI: aiox webhook
 * Manage and test webhooks for event dispatch
 *
 * Usage:
 *   aiox webhook add <url> [--events <types>] [--name <name>]
 *   aiox webhook list [--format json|markdown]
 *   aiox webhook get <webhook-id>
 *   aiox webhook delete <webhook-id>
 *   aiox webhook test <webhook-id>
 *   aiox webhook dispatch <insights-file>
 */

const CONFIG_FILE = path.join(process.cwd(), '.aiox-webhooks.json');

let webhookManager = new WebhookManager();

function loadConfig() {
  if (fs.existsSync(CONFIG_FILE)) {
    const data = fs.readFileSync(CONFIG_FILE, 'utf8');
    try {
      const config = JSON.parse(data);
      webhookManager.import(config);
    } catch (error) {
      console.error(`Error loading config: ${error.message}`);
    }
  }
}

function saveConfig() {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(webhookManager.export(), null, 2));
}

function printHelp() {
  console.log(`
aiox webhook — Manage webhooks for event dispatch

Usage:
  aiox webhook add <url> [options]
  aiox webhook list [--format json|markdown]
  aiox webhook get <webhook-id>
  aiox webhook delete <webhook-id>
  aiox webhook test <webhook-id>
  aiox webhook dispatch <insights-file> [--dry-run]
  aiox webhook stats

add options:
  --events TYPES    Comma-separated event types (default: *)
  --name NAME       Human-readable name
  --timeout MS      Request timeout in ms (default: 5000)
  --retry NUM       Number of retries (default: 3)

dispatch options:
  --dry-run         Simulate without actual dispatch

Examples:
  aiox webhook add https://example.com/hook --events insight.*
  aiox webhook list --format markdown
  aiox webhook delete wh_abc123
  aiox webhook test wh_abc123
  aiox webhook dispatch insights.json
`);
}

function parseArgs() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  return args;
}

function add(args) {
  const url = args[1];
  if (!url) {
    console.error('Error: URL is required');
    process.exit(1);
  }

  const config = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i] === '--events' && i + 1 < args.length) {
      config.events = args[i + 1].split(',').map((e) => e.trim());
      i++;
    } else if (args[i] === '--name' && i + 1 < args.length) {
      config.name = args[i + 1];
      i++;
    } else if (args[i] === '--timeout' && i + 1 < args.length) {
      config.timeout = parseInt(args[i + 1]);
      i++;
    } else if (args[i] === '--retry' && i + 1 < args.length) {
      config.retryAttempts = parseInt(args[i + 1]);
      i++;
    }
  }

  try {
    const webhook = webhookManager.addWebhook(url, config);
    saveConfig();
    console.log(`✓ Webhook added: ${webhook.id}`);
    console.log(JSON.stringify(webhook, null, 2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

function list(args) {
  const format = args.includes('--format') ? args[args.indexOf('--format') + 1] : 'json';
  const webhooks = webhookManager.listWebhooks();

  if (format === 'markdown') {
    console.log('# Webhooks\n');
    console.log(`**Total:** ${webhooks.length}\n`);

    for (const webhook of webhooks) {
      console.log(`## ${webhook.name}`);
      console.log(`- **ID:** \`${webhook.id}\``);
      console.log(`- **URL:** ${webhook.url}`);
      console.log(`- **Events:** ${webhook.events.join(', ')}`);
      console.log(`- **Active:** ${webhook.active ? 'Yes' : 'No'}`);
      console.log(`- **Timeout:** ${webhook.timeout}ms`);
      console.log(`- **Retries:** ${webhook.retryAttempts}`);
      console.log(`- **Last Triggered:** ${webhook.lastTriggeredAt || 'Never'}`);
      console.log('');
    }
  } else {
    console.log(JSON.stringify(webhooks, null, 2));
  }
}

function get(args) {
  const id = args[1];
  if (!id) {
    console.error('Error: Webhook ID is required');
    process.exit(1);
  }

  const webhook = webhookManager.getWebhook(id);
  if (!webhook) {
    console.error(`Error: Webhook not found: ${id}`);
    process.exit(1);
  }

  console.log(JSON.stringify(webhook, null, 2));
}

function del(args) {
  const id = args[1];
  if (!id) {
    console.error('Error: Webhook ID is required');
    process.exit(1);
  }

  if (webhookManager.deleteWebhook(id)) {
    saveConfig();
    console.log(`✓ Webhook deleted: ${id}`);
  } else {
    console.error(`Error: Webhook not found: ${id}`);
    process.exit(1);
  }
}

function test(args) {
  const id = args[1];
  if (!id) {
    console.error('Error: Webhook ID is required');
    process.exit(1);
  }

  const webhook = webhookManager.getWebhook(id);
  if (!webhook) {
    console.error(`Error: Webhook not found: ${id}`);
    process.exit(1);
  }

  const dispatcher = new EventDispatcher(webhookManager);
  const testEvent = EventSchema.createCustomEvent('test.webhook', 5, 'test', {
    message: 'This is a test webhook dispatch',
  });

  const result = dispatcher.dispatch(testEvent, [webhook]);
  console.log(JSON.stringify(result, null, 2));
}

function dispatch(args) {
  const file = args[1];
  if (!file) {
    console.error('Error: Insights file is required');
    process.exit(1);
  }

  const dryRun = args.includes('--dry-run');

  try {
    const fullPath = path.isAbsolute(file) ? file : path.resolve(process.cwd(), file);
    const content = fs.readFileSync(fullPath, 'utf8');
    const insights = JSON.parse(content);
    const insightArray = Array.isArray(insights) ? insights : insights.insights || [];

    const webhooks = webhookManager.listWebhooks();
    const dispatcher = new EventDispatcher(webhookManager);

    const results = {
      status: 'ok',
      dispatched: 0,
      failed: 0,
      total: insightArray.length,
      details: [],
    };

    for (const insight of insightArray) {
      const event = EventSchema.createInsightEvent(insight);
      const dispatchResult = dispatcher.dispatch(event, webhooks);

      results.dispatched += dispatchResult.dispatched?.length || 0;
      results.failed += dispatchResult.failed?.length || 0;
      results.details.push({
        eventId: event.id,
        eventType: event.type,
        dispatched: dispatchResult.dispatched?.length || 0,
        failed: dispatchResult.failed?.length || 0,
      });
    }

    console.log(JSON.stringify(results, null, 2));
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

function stats() {
  const stats = webhookManager.getStats();
  console.log(JSON.stringify(stats, null, 2));
}

function main() {
  try {
    loadConfig();
    const args = parseArgs();
    const command = args[0];

    switch (command) {
      case 'add':
        add(args);
        break;
      case 'list':
        list(args);
        break;
      case 'get':
        get(args);
        break;
      case 'delete':
        del(args);
        break;
      case 'test':
        test(args);
        break;
      case 'dispatch':
        dispatch(args);
        break;
      case 'stats':
        stats();
        break;
      default:
        console.error(`Unknown command: ${command}`);
        printHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();
