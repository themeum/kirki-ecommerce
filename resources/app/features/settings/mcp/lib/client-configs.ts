import { __ } from '@/wpi18n';

const SERVER_KEY = 'kirki-ecommerce';
const REMOTE_PACKAGE = '@automattic/mcp-wordpress-remote@latest';
const PASSWORD_PLACEHOLDER = '<your application password>';

const MCP_CLIENT_IDS = [
  'claude-desktop',
  'claude-code',
  'cursor',
  'vscode',
  'codex',
  'gemini-cli',
  'windsurf',
  'other',
] as const;

type McpClientId = (typeof MCP_CLIENT_IDS)[number];

type ConnectionDetails = {
  serverUrl: string;
  userLogin: string;
};

type ConfigLocation = {
  label: string;
  path: string;
};

type ClientConfig = {
  format: 'json' | 'toml' | 'shell';
  text: string;
  locations: ConfigLocation[];
};

const getClientName = (clientId: McpClientId) => {
  const names: Record<McpClientId, string> = {
    'claude-desktop': 'Claude Desktop',
    'claude-code': 'Claude Code',
    cursor: 'Cursor',
    vscode: 'VS Code',
    codex: 'Codex',
    'gemini-cli': 'Gemini CLI',
    windsurf: 'Windsurf',
    other: __('Other MCP client', 'kirki-ecommerce'),
  };

  return names[clientId];
};

const remoteEnv = ({ serverUrl, userLogin }: ConnectionDetails) => ({
  WP_API_URL: serverUrl,
  WP_API_USERNAME: userLogin,
  WP_API_PASSWORD: PASSWORD_PLACEHOLDER,
});

const stdioServer = (details: ConnectionDetails) => ({
  command: 'npx',
  args: ['-y', REMOTE_PACKAGE],
  env: remoteEnv(details),
});

const toJson = (value: unknown) => JSON.stringify(value, null, 2);

const mcpServersJson = (details: ConnectionDetails) => {
  return toJson({ mcpServers: { [SERVER_KEY]: stdioServer(details) } });
};

const vscodeJson = (details: ConnectionDetails) => {
  return toJson({ servers: { [SERVER_KEY]: { type: 'stdio', ...stdioServer(details) } } });
};

const codexToml = (details: ConnectionDetails) => {
  const env = Object.entries(remoteEnv(details))
    .map(([key, value]) => `${key} = ${JSON.stringify(value)}`)
    .join(', ');

  return [
    `[mcp_servers.${SERVER_KEY}]`,
    'command = "npx"',
    `args = ["-y", "${REMOTE_PACKAGE}"]`,
    `env = { ${env} }`,
  ].join('\n');
};

const claudeCodeCommand = (details: ConnectionDetails) => {
  const env = Object.entries(remoteEnv(details)).map(([key, value]) => `  -e ${key}="${value}" \\`);

  return [`claude mcp add ${SERVER_KEY} \\`, ...env, `  -- npx -y ${REMOTE_PACKAGE}`].join('\n');
};

const buildClientConfig = (clientId: McpClientId, details: ConnectionDetails): ClientConfig => {
  switch (clientId) {
    case 'claude-desktop':
      return {
        format: 'json',
        text: mcpServersJson(details),
        locations: [
          {
            label: 'macOS',
            path: '~/Library/Application Support/Claude/claude_desktop_config.json',
          },
          { label: 'Windows', path: '%APPDATA%\\Claude\\claude_desktop_config.json' },
        ],
      };
    case 'claude-code':
      return { format: 'shell', text: claudeCodeCommand(details), locations: [] };
    case 'cursor':
      return {
        format: 'json',
        text: mcpServersJson(details),
        locations: [
          { label: __('This project', 'kirki-ecommerce'), path: '.cursor/mcp.json' },
          { label: __('All projects', 'kirki-ecommerce'), path: '~/.cursor/mcp.json' },
        ],
      };
    case 'vscode':
      return {
        format: 'json',
        text: vscodeJson(details),
        locations: [{ label: __('This workspace', 'kirki-ecommerce'), path: '.vscode/mcp.json' }],
      };
    case 'codex':
      return {
        format: 'toml',
        text: codexToml(details),
        locations: [{ label: __('All projects', 'kirki-ecommerce'), path: '~/.codex/config.toml' }],
      };
    case 'gemini-cli':
      return {
        format: 'json',
        text: mcpServersJson(details),
        locations: [
          { label: __('All projects', 'kirki-ecommerce'), path: '~/.gemini/settings.json' },
          { label: __('This project', 'kirki-ecommerce'), path: '.gemini/settings.json' },
        ],
      };
    case 'windsurf':
      return {
        format: 'json',
        text: mcpServersJson(details),
        locations: [
          {
            label: __('All projects', 'kirki-ecommerce'),
            path: '~/.codeium/windsurf/mcp_config.json',
          },
        ],
      };
    default:
      return { format: 'json', text: mcpServersJson(details), locations: [] };
  }
};

export {
  buildClientConfig,
  type ClientConfig,
  type ConfigLocation,
  type ConnectionDetails,
  getClientName,
  MCP_CLIENT_IDS,
  type McpClientId,
  PASSWORD_PLACEHOLDER,
  SERVER_KEY,
};
