#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const CREDENTIALS_PATH = process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  join(__dirname, 'credentials', 'n8n-automacoes-439221-d1f8e533786b.json');

if (!CREDENTIALS_PATH) {
  console.error('Error: GOOGLE_APPLICATION_CREDENTIALS env var not set');
  process.exit(1);
}

let credentials;
try {
  credentials = JSON.parse(readFileSync(CREDENTIALS_PATH, 'utf8'));
} catch (e) {
  console.error(`Error reading credentials file at ${CREDENTIALS_PATH}:`, e.message);
  process.exit(1);
}

const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/tagmanager.edit.containers',
           'https://www.googleapis.com/auth/tagmanager.manage.accounts',
           'https://www.googleapis.com/auth/tagmanager.publish',
           'https://www.googleapis.com/auth/tagmanager.readonly']
});

const tagmanager = google.tagmanager({ version: 'v2', auth });

const server = new Server(
  { name: 'gtm-mcp', version: '1.0.0' },
  { capabilities: { tools: {} } }
);

const TOOLS = [
  {
    name: 'gtm_list_accounts',
    description: 'Lista todas as contas GTM acessíveis',
    inputSchema: { type: 'object', properties: {} }
  },
  {
    name: 'gtm_list_containers',
    description: 'Lista os containers de uma conta GTM',
    inputSchema: {
      type: 'object',
      required: ['account_id'],
      properties: {
        account_id: { type: 'string', description: 'ID da conta GTM' }
      }
    }
  },
  {
    name: 'gtm_list_workspaces',
    description: 'Lista os workspaces de um container',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' }
      }
    }
  },
  {
    name: 'gtm_list_tags',
    description: 'Lista todas as tags de um workspace',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id', 'workspace_id'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' },
        workspace_id: { type: 'string' }
      }
    }
  },
  {
    name: 'gtm_get_tag',
    description: 'Retorna detalhes de uma tag específica',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id', 'workspace_id', 'tag_id'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' },
        workspace_id: { type: 'string' },
        tag_id: { type: 'string' }
      }
    }
  },
  {
    name: 'gtm_create_tag',
    description: 'Cria uma nova tag no workspace',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id', 'workspace_id', 'name', 'type', 'parameter', 'firing_trigger_id'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' },
        workspace_id: { type: 'string' },
        name: { type: 'string', description: 'Nome da tag' },
        type: { type: 'string', description: 'Tipo da tag (ex: html, ua, gaawc)' },
        parameter: {
          type: 'array',
          description: 'Parâmetros da tag',
          items: {
            type: 'object',
            properties: {
              type: { type: 'string' },
              key: { type: 'string' },
              value: { type: 'string' }
            }
          }
        },
        firing_trigger_id: {
          type: 'array',
          description: 'IDs dos triggers que disparam a tag',
          items: { type: 'string' }
        }
      }
    }
  },
  {
    name: 'gtm_update_tag',
    description: 'Atualiza uma tag existente',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id', 'workspace_id', 'tag_id', 'name', 'type', 'parameter'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' },
        workspace_id: { type: 'string' },
        tag_id: { type: 'string' },
        name: { type: 'string' },
        type: { type: 'string' },
        parameter: { type: 'array', items: { type: 'object' } },
        firing_trigger_id: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  {
    name: 'gtm_delete_tag',
    description: 'Remove uma tag do workspace',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id', 'workspace_id', 'tag_id'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' },
        workspace_id: { type: 'string' },
        tag_id: { type: 'string' }
      }
    }
  },
  {
    name: 'gtm_list_triggers',
    description: 'Lista todos os triggers de um workspace',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id', 'workspace_id'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' },
        workspace_id: { type: 'string' }
      }
    }
  },
  {
    name: 'gtm_list_variables',
    description: 'Lista todas as variáveis de um workspace',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id', 'workspace_id'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' },
        workspace_id: { type: 'string' }
      }
    }
  },
  {
    name: 'gtm_create_version',
    description: 'Cria uma nova versão do container a partir do workspace',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id', 'workspace_id'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' },
        workspace_id: { type: 'string' },
        name: { type: 'string', description: 'Nome da versão' },
        notes: { type: 'string', description: 'Notas da versão' }
      }
    }
  },
  {
    name: 'gtm_publish_version',
    description: 'Publica uma versão do container',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id', 'version_id'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' },
        version_id: { type: 'string' }
      }
    }
  },
  {
    name: 'gtm_get_workspace_status',
    description: 'Retorna o status do workspace (mudanças pendentes)',
    inputSchema: {
      type: 'object',
      required: ['account_id', 'container_id', 'workspace_id'],
      properties: {
        account_id: { type: 'string' },
        container_id: { type: 'string' },
        workspace_id: { type: 'string' }
      }
    }
  }
];

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const { account_id, container_id, workspace_id, tag_id, version_id } = args || {};

  const parent_account = `accounts/${account_id}`;
  const parent_container = `accounts/${account_id}/containers/${container_id}`;
  const parent_workspace = `accounts/${account_id}/containers/${container_id}/workspaces/${workspace_id}`;

  try {
    let result;

    switch (name) {
      case 'gtm_list_accounts': {
        const res = await tagmanager.accounts.list();
        result = res.data.account || [];
        break;
      }
      case 'gtm_list_containers': {
        const res = await tagmanager.accounts.containers.list({ parent: parent_account });
        result = res.data.container || [];
        break;
      }
      case 'gtm_list_workspaces': {
        const res = await tagmanager.accounts.containers.workspaces.list({ parent: parent_container });
        result = res.data.workspace || [];
        break;
      }
      case 'gtm_list_tags': {
        const res = await tagmanager.accounts.containers.workspaces.tags.list({ parent: parent_workspace });
        result = res.data.tag || [];
        break;
      }
      case 'gtm_get_tag': {
        const res = await tagmanager.accounts.containers.workspaces.tags.get({
          path: `${parent_workspace}/tags/${tag_id}`
        });
        result = res.data;
        break;
      }
      case 'gtm_create_tag': {
        const res = await tagmanager.accounts.containers.workspaces.tags.create({
          parent: parent_workspace,
          requestBody: {
            name: args.name,
            type: args.type,
            parameter: args.parameter,
            firingTriggerId: args.firing_trigger_id
          }
        });
        result = res.data;
        break;
      }
      case 'gtm_update_tag': {
        const res = await tagmanager.accounts.containers.workspaces.tags.update({
          path: `${parent_workspace}/tags/${tag_id}`,
          requestBody: {
            name: args.name,
            type: args.type,
            parameter: args.parameter,
            firingTriggerId: args.firing_trigger_id
          }
        });
        result = res.data;
        break;
      }
      case 'gtm_delete_tag': {
        await tagmanager.accounts.containers.workspaces.tags.delete({
          path: `${parent_workspace}/tags/${tag_id}`
        });
        result = { success: true, message: `Tag ${tag_id} removida` };
        break;
      }
      case 'gtm_list_triggers': {
        const res = await tagmanager.accounts.containers.workspaces.triggers.list({ parent: parent_workspace });
        result = res.data.trigger || [];
        break;
      }
      case 'gtm_list_variables': {
        const res = await tagmanager.accounts.containers.workspaces.variables.list({ parent: parent_workspace });
        result = res.data.variable || [];
        break;
      }
      case 'gtm_create_version': {
        const res = await tagmanager.accounts.containers.workspaces.create_version({
          path: parent_workspace,
          requestBody: {
            name: args.name,
            notes: args.notes
          }
        });
        result = res.data;
        break;
      }
      case 'gtm_publish_version': {
        const res = await tagmanager.accounts.containers.versions.publish({
          path: `accounts/${account_id}/containers/${container_id}/versions/${version_id}`
        });
        result = res.data;
        break;
      }
      case 'gtm_get_workspace_status': {
        const res = await tagmanager.accounts.containers.workspaces.getStatus({ path: parent_workspace });
        result = res.data;
        break;
      }
      default:
        throw new Error(`Tool desconhecida: ${name}`);
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
    };
  } catch (error) {
    return {
      content: [{ type: 'text', text: `Erro: ${error.message}` }],
      isError: true
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
