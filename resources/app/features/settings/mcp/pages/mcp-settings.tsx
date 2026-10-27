import { Bot, ChevronRight, Eye, Plus } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';

import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import { Separator } from '@/components/ui/separator';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import ClientLogo from '@/features/settings/mcp/components/client-logo';
import CodeBlock from '@/features/settings/mcp/components/code-block';
import ConnectAppDialog from '@/features/settings/mcp/components/connect-app-dialog';
import SettingsSwitchRow from '@/features/settings/mcp/components/settings-switch-row';
import useMcpSettings from '@/features/settings/mcp/hooks/use-mcp-settings';
import { countAbilities, countAbilitiesOn } from '@/features/settings/mcp/lib/abilities';
import { getClientName, MCP_CLIENT_IDS } from '@/features/settings/mcp/lib/client-configs';
import { hasDistinctClientLogo } from '@/features/settings/mcp/lib/client-logos';
import McpSettingsSkeleton from '@/features/settings/mcp/skeletons/mcp-settings-skeleton';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const McpSettings = () => {
  const { settings, switches, isLoading, commit } = useMcpSettings();
  const [isConnectOpen, setIsConnectOpen] = useState(false);

  if (isLoading) {
    return <McpSettingsSkeleton />;
  }

  const catalog = settings?.catalog ?? [];
  const isAdapterAvailable = settings?.adapter_available ?? false;
  const serverUrl = settings?.server_url ?? '';

  return (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader icon={<Bot size={16} />} title={__('MCP', 'kirki-ecommerce')} />

        {!isAdapterAvailable && (
          <Alert
            type="warning"
            text={__(
              'The MCP server needs WordPress 6.9 or later and the MCP Adapter plugin. You can set everything up now. The settings apply when the MCP Adapter plugin is active.',
              'kirki-ecommerce',
            )}
          />
        )}

        <Flex direction="column" gap={2}>
          <Text weight="semibold" cssOverride={styles.sectionTitle}>
            {__('Configuration', 'kirki-ecommerce')}
          </Text>
          <Card
            data-search-id="mcp.configuration"
            data-search-title={__('MCP configuration', 'kirki-ecommerce')}
            data-search-keywords="mcp, model context protocol, ai, claude, cursor, chatgpt, agent, assistant, read-only, server url, abilities, tools"
          >
            <CardHeader>
              <SettingsSwitchRow
                title={__('Kirki eCommerce MCP', 'kirki-ecommerce')}
                description={__(
                  'Let AI apps like Claude, Cursor and VS Code work with your store through the Model Context Protocol.',
                  'kirki-ecommerce',
                )}
                control={
                  <Switch
                    checked={switches.enabled}
                    aria-label={__('Kirki eCommerce MCP', 'kirki-ecommerce')}
                    onCheckedChange={(checked) =>
                      void commit((previous) => ({ ...previous, enabled: checked }))
                    }
                  />
                }
              />
            </CardHeader>

            {switches.enabled && (
              <CardContent>
                <Flex direction="column" gap={4}>
                  <Separator negativeMargin={16} />

                  <Flex justify="space-between" align="center" gap={4}>
                    <Flex direction="column" cssOverride={styles.rowText}>
                      <Text weight="semibold">{__('Server URL', 'kirki-ecommerce')}</Text>
                      <Text variant="small" color="secondary">
                        {__(
                          'AI apps connect to this address. Each app also needs an application password.',
                          'kirki-ecommerce',
                        )}
                      </Text>
                    </Flex>
                    <div css={scoped(styles.urlField)}>
                      {isAdapterAvailable && serverUrl ? (
                        <CodeBlock
                          text={serverUrl}
                          copyLabel={__('Copy server URL', 'kirki-ecommerce')}
                          isInline
                        />
                      ) : (
                        <Text variant="small" color="secondary">
                          {__('Not available', 'kirki-ecommerce')}
                        </Text>
                      )}
                    </div>
                  </Flex>

                  <Separator negativeMargin={16} />

                  <SettingsSwitchRow
                    title={__('Read-only mode', 'kirki-ecommerce')}
                    description={__(
                      'AI apps can look things up but cannot create, change or delete anything.',
                      'kirki-ecommerce',
                    )}
                    control={
                      <Switch
                        checked={switches.read_only}
                        aria-label={__('Read-only mode', 'kirki-ecommerce')}
                        onCheckedChange={(checked) =>
                          void commit((previous) => ({ ...previous, read_only: checked }))
                        }
                      />
                    }
                  />

                  <Separator negativeMargin={16} />

                  <Link
                    to={RouteConfig.Settings.get('McpSettings').get('McpAbilities').buildLink()}
                    css={scoped(styles.abilitiesRow)}
                  >
                    <SettingsSwitchRow
                      title={__('Abilities', 'kirki-ecommerce')}
                      description={__(
                        'Choose which tools, resources and prompts AI apps can use.',
                        'kirki-ecommerce',
                      )}
                      control={
                        <span css={scoped(styles.abilitiesCount)}>
                          {sprintf(
                            /* translators: %1$d: number of abilities that are on, %2$d: number of all abilities */
                            __('%1$d of %2$d on', 'kirki-ecommerce'),
                            countAbilitiesOn(switches, catalog),
                            countAbilities(catalog),
                          )}
                          <ChevronRight size={16} aria-hidden="true" />
                        </span>
                      }
                    />
                  </Link>
                </Flex>
              </CardContent>
            )}
          </Card>
        </Flex>

        {switches.enabled && switches.read_only && (
          <Alert
            type="warning"
            icon={<Eye size={16} />}
            text={
              <Text variant="small" color="warning">
                <strong>{__('Read-only mode is on.', 'kirki-ecommerce')}</strong>{' '}
                {__('Write tools are blocked for every connection.', 'kirki-ecommerce')}
              </Text>
            }
          />
        )}

        <Flex direction="column" gap={2}>
          <Text weight="semibold" cssOverride={styles.sectionTitle}>
            {__('Connections', 'kirki-ecommerce')}
          </Text>
          <Card
            data-search-id="mcp.connect"
            data-search-title={__('Connect your AI app', 'kirki-ecommerce')}
            data-search-keywords="connect app, claude desktop, claude code, cursor, vs code, codex, gemini, windsurf, application password, wp_api_password"
          >
            <CardContent>
              <Flex direction="column" gap={3} align="flex-start">
                <Flex direction="column">
                  <Text weight="semibold">
                    {__('Connect your AI app', 'kirki-ecommerce')}
                  </Text>
                  <Text variant="small" color="secondary">
                    {__(
                      'Pick the app you use. We show the config for that app and how to get its application password.',
                      'kirki-ecommerce',
                    )}
                  </Text>
                </Flex>
                <Flex gap={2} wrap="wrap">
                  {MCP_CLIENT_IDS.filter(hasDistinctClientLogo).map((id) => (
                    <ClientLogo key={id} clientId={id} title={getClientName(id)} />
                  ))}
                </Flex>
                <Button size="sm" onClick={() => setIsConnectOpen(true)}>
                  <Plus size={14} />
                  {__('Connect app', 'kirki-ecommerce')}
                </Button>
              </Flex>
            </CardContent>
          </Card>
        </Flex>
      </Flex>

      <ConnectAppDialog
        open={isConnectOpen}
        onOpenChange={setIsConnectOpen}
        isMcpEnabled={switches.enabled}
        serverUrl={serverUrl}
        userLogin={settings?.user_login ?? ''}
        profileUrl={settings?.profile_url ?? ''}
        isApplicationPasswordAvailable={settings?.application_passwords_available ?? false}
      />
    </Container>
  );
};

McpSettings.displayName = 'McpSettings';

export default McpSettings;

const styles = defineStyles({
  sectionTitle: {
    paddingInline: theme.spacing[2],
  },
  rowText: {
    minWidth: 0,
    flex: 1,
  },
  urlField: {
    display: 'flex',
    justifyContent: 'flex-end',
    flex: 1,
    minWidth: 0,
  },
  abilitiesRow: {
    display: 'block',
    margin: `-${theme.spacing[2]}`,
    padding: theme.spacing[2],
    borderRadius: theme.radius.lg,
    color: 'inherit',
    textDecoration: 'none',
    '&:hover': {
      backgroundColor: theme.colors.background.surfaceAlt,
    },
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.background.fillBrand}`,
      outlineOffset: '2px',
    },
  },
  abilitiesCount: {
    ...theme.typography.small('medium'),
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[1],
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
  },
});
