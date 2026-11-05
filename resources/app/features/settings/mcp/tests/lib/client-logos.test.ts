import { describe, expect, it } from 'vitest';

import { MCP_CLIENT_IDS } from '@/features/settings/mcp/lib/client-configs';
import { hasDistinctClientLogo } from '@/features/settings/mcp/lib/client-logos';

describe('hasDistinctClientLogo', () => {
  it('keeps one client for each logo', () => {
    const clientIds = MCP_CLIENT_IDS.filter(hasDistinctClientLogo);

    expect(clientIds).toContain('claude-desktop');
    expect(clientIds).not.toContain('claude-code');
    expect(clientIds).toEqual(['claude-desktop', 'cursor', 'vscode', 'gemini-cli']);
  });
});
