import { Bot, Eye, RotateCcw } from 'lucide-react';
import { useState } from 'react';

import ConfirmationDialog from '@/components/modal/confirmation-dialog';
import Alert from '@/components/ui/alert';
import Button from '@/components/ui/button';
import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { RouteConfig } from '@/config/route-config';
import AbilityGroup from '@/features/settings/mcp/components/ability-group';
import useMcpSettings from '@/features/settings/mcp/hooks/use-mcp-settings';
import { resetAbilities } from '@/features/settings/mcp/lib/abilities';
import McpAbilitiesSkeleton from '@/features/settings/mcp/skeletons/mcp-abilities-skeleton';
import SettingsPageHeader from '@/features/settings/pages/settings-page-header';
import { __ } from '@/wpi18n';

const McpAbilities = () => {
  const { settings, switches, isLoading, commit } = useMcpSettings();
  const [isResetOpen, setIsResetOpen] = useState(false);

  if (isLoading) {
    return <McpAbilitiesSkeleton />;
  }

  const catalog = settings?.catalog ?? [];

  const handleToggleGroup = (groupId: string, checked: boolean) => {
    void commit((previous) => ({
      ...previous,
      groups: { ...previous.groups, [groupId]: checked },
    }));
  };

  const handleToggleAbility = (abilityName: string, checked: boolean) => {
    void commit((previous) => ({
      ...previous,
      abilities: { ...previous.abilities, [abilityName]: checked },
    }));
  };

  const handleReset = () => {
    setIsResetOpen(false);
    void commit(resetAbilities);
  };

  return (
    <Container size="sm">
      <Flex direction="column" gap={4}>
        <SettingsPageHeader
          icon={<Bot size={16} />}
          title={__('Abilities', 'kirki-ecommerce')}
          breadcrumbs={[
            {
              label: __('MCP', 'kirki-ecommerce'),
              to: RouteConfig.Settings.get('McpSettings').buildLink(),
            },
          ]}
          actions={
            <Button variant="outline" size="sm" onClick={() => setIsResetOpen(true)}>
              <RotateCcw size={14} />
              {__('Reset to default', 'kirki-ecommerce')}
            </Button>
          }
        />

        {switches.read_only && (
          <Alert
            type="warning"
            icon={<Eye size={16} />}
            text={
              <Flex justify="space-between" align="center" gap={3}>
                <Text variant="small" color="warning">
                  <strong>{__('Read-only mode is on.', 'kirki-ecommerce')}</strong>{' '}
                  {__('Write tools are blocked for every connection.', 'kirki-ecommerce')}
                </Text>
                <Button
                  variant="outline"
                  size="xs"
                  onClick={() => void commit((previous) => ({ ...previous, read_only: false }))}
                >
                  {__('Turn off', 'kirki-ecommerce')}
                </Button>
              </Flex>
            }
          />
        )}

        <Flex direction="column" gap={3}>
          {catalog.map((group) => (
            <AbilityGroup
              key={group.id}
              group={group}
              switches={switches}
              onToggleGroup={handleToggleGroup}
              onToggleAbility={handleToggleAbility}
            />
          ))}
        </Flex>
      </Flex>

      <ConfirmationDialog
        open={isResetOpen}
        variant="warning"
        title={__('Reset abilities to default?', 'kirki-ecommerce')}
        subtitle={__(
          'All groups and abilities turn on, and read-only mode turns off. The main MCP switch does not change.',
          'kirki-ecommerce',
        )}
        confirmText={__('Reset', 'kirki-ecommerce')}
        onConfirm={handleReset}
        onCancel={() => setIsResetOpen(false)}
      />
    </Container>
  );
};

McpAbilities.displayName = 'McpAbilities';

export default McpAbilities;
