import { describe, expect, it } from 'vitest';

import {
  buildClientConfig,
  MCP_CLIENT_IDS,
  PASSWORD_PLACEHOLDER,
} from '@/features/settings/mcp/lib/client-configs';

const details = {
  serverUrl: 'https://shop.test/wp-json/kirki-ecommerce/v1/mcp/kirki-ecommerce',
  userLogin: 'admin',
};

const expectedEnv = {
  WP_API_URL: details.serverUrl,
  WP_API_USERNAME: 'admin',
  WP_API_PASSWORD: '<your application password>',
};

describe('buildClientConfig', () => {
  it('builds the Claude Desktop JSON with the npx remote package and the 3 environment values', () => {
    const config = buildClientConfig('claude-desktop', details);

    expect(config.format).toBe('json');
    expect(JSON.parse(config.text)).toEqual({
      mcpServers: {
        'kirki-ecommerce': {
          command: 'npx',
          args: ['-y', '@automattic/mcp-wordpress-remote@latest'],
          env: expectedEnv,
        },
      },
    });
    expect(config.locations.map((location) => location.label)).toEqual(['macOS', 'Windows']);
  });

  it('builds the Claude Code command for the kirki-ecommerce server', () => {
    const config = buildClientConfig('claude-code', details);

    expect(config.format).toBe('shell');
    expect(config.text).toBe(
      [
        'claude mcp add kirki-ecommerce \\',
        `  -e WP_API_URL="${details.serverUrl}" \\`,
        '  -e WP_API_USERNAME="admin" \\',
        '  -e WP_API_PASSWORD="<your application password>" \\',
        '  -- npx -y @automattic/mcp-wordpress-remote@latest',
      ].join('\n'),
    );
  });

  it('builds the Codex TOML table', () => {
    const config = buildClientConfig('codex', details);

    expect(config.format).toBe('toml');
    expect(config.text).toBe(
      [
        '[mcp_servers.kirki-ecommerce]',
        'command = "npx"',
        'args = ["-y", "@automattic/mcp-wordpress-remote@latest"]',
        `env = { WP_API_URL = "${details.serverUrl}", WP_API_USERNAME = "admin", WP_API_PASSWORD = "<your application password>" }`,
      ].join('\n'),
    );
  });

  it('uses the stdio type in the VS Code config', () => {
    const parsed = JSON.parse(buildClientConfig('vscode', details).text) as {
      servers: Record<string, { type: string }>;
    };

    expect(parsed.servers['kirki-ecommerce'].type).toBe('stdio');
  });

  it('puts the password placeholder in every client config', () => {
    MCP_CLIENT_IDS.forEach((clientId) => {
      expect(buildClientConfig(clientId, details).text).toContain(PASSWORD_PLACEHOLDER);
    });
  });
});
