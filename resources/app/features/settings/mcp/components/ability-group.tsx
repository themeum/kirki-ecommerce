import { InfoCircledIcon } from '@radix-ui/react-icons';
import { Database, MessageSquareText, Wrench } from 'lucide-react';

import OptionAccordion from '@/components/option-accordion';
import Flex from '@/components/ui/flex';
import {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItems,
  StackedItemTitle,
} from '@/components/ui/stacked-items';
import Switch from '@/components/ui/switch';
import Text from '@/components/ui/text';
import Tooltip from '@/components/ui/tooltip';
import {
  isAbilityBlocked,
  isAbilityOn,
  isBlockedByReadOnly,
  isGroupOn,
  type McpSwitches,
} from '@/features/settings/mcp/lib/abilities';
import type {
  McpAbility,
  McpAbilityGroup,
  McpAbilityKind,
} from '@/features/settings/mcp/schemas/catalog/mcp';
import { theme } from '@/theme';
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';
import { __, _n, sprintf } from '@/wpi18n';

type AbilityGroupProps = {
  group: McpAbilityGroup;
  switches: McpSwitches;
  onToggleGroup: (groupId: string, checked: boolean) => void;
  onToggleAbility: (abilityName: string, checked: boolean) => void;
};

type KindIconProps = {
  kind: McpAbilityKind;
};

type ModeLabelProps = {
  isWrite: boolean;
  label?: string;
};

const kindLabel = (kind: McpAbilityKind) => {
  const labels: Record<McpAbilityKind, string> = {
    tool: __('Tool', 'kirki-ecommerce'),
    resource: __('Resource', 'kirki-ecommerce'),
    prompt: __('Prompt', 'kirki-ecommerce'),
  };

  return labels[kind];
};

const kindIcons = {
  tool: Wrench,
  resource: Database,
  prompt: MessageSquareText,
} as const;

const KindIcon = ({ kind }: KindIconProps) => {
  const Icon = kindIcons[kind];

  return (
    <span
      css={scoped(styles.kindIcon)}
      role="img"
      aria-label={kindLabel(kind)}
      title={kindLabel(kind)}
    >
      <Icon size={14} aria-hidden="true" />
    </span>
  );
};

KindIcon.displayName = 'KindIcon';

const ModeLabel = ({ isWrite, label }: ModeLabelProps) => (
  <span css={scoped(styles.mode)}>
    <i css={scoped(mergeCss(styles.dot, isWrite ? styles.writeDot : styles.readDot))} />
    {label ?? (isWrite ? __('write', 'kirki-ecommerce') : __('read', 'kirki-ecommerce'))}
  </span>
);

ModeLabel.displayName = 'ModeLabel';

const AbilityGroup = (props: AbilityGroupProps) => {
  const { group, switches, onToggleGroup, onToggleAbility } = props;

  const isOn = isGroupOn(switches, group.id);
  const writeCount = group.abilities.filter((ability) => ability.is_write).length;
  const readCount = group.abilities.length - writeCount;

  const renderAbility = (ability: McpAbility) => {
    const isBlocked = isAbilityBlocked(switches, group.id, ability);

    return (
      <StackedItem
        key={ability.name}
        id={ability.name}
        cssOverride={mergeCss(styles.abilityRow, isBlocked && styles.blockedRow)}
      >
        <StackedItemContent>
          <StackedItemTitle>
            <KindIcon kind={ability.kind} />
            <Text variant="small" weight="medium" truncate>
              {ability.title}
            </Text>
            {ability.description && (
              <Tooltip tip={ability.description}>
                <span
                  css={scoped(styles.infoIcon)}
                  role="img"
                  aria-label={ability.description}
                  data-ability-info=""
                >
                  <InfoCircledIcon width={14} height={14} />
                </span>
              </Tooltip>
            )}
          </StackedItemTitle>
        </StackedItemContent>
        <StackedItemActions>
          {isOn && isBlockedByReadOnly(switches, ability) && (
            <Text variant="tiny" color="secondary">
              {__('Blocked by read-only', 'kirki-ecommerce')}
            </Text>
          )}
          <ModeLabel isWrite={ability.is_write} />
          <Switch
            checked={isAbilityOn(switches, group.id, ability)}
            disabled={isBlocked}
            aria-label={ability.title}
            onCheckedChange={(checked) => onToggleAbility(ability.name, checked)}
          />
        </StackedItemActions>
      </StackedItem>
    );
  };

  return (
    <OptionAccordion
      header={group.label}
      subHeader={group.description}
      variant="shipping"
      enabled={isOn}
      cssOverride={styles.accordion}
      meta={
        <Flex gap={3} align="center" wrap="wrap">
          <Text variant="small" color="secondary">
            {sprintf(
              /* translators: %d: number of abilities in the group */
              _n('%d ability', '%d abilities', group.abilities.length, 'kirki-ecommerce'),
              group.abilities.length,
            )}
          </Text>
          {readCount > 0 && (
            <ModeLabel
              isWrite={false}
              label={sprintf(
                /* translators: %d: number of read abilities */
                __('%d read', 'kirki-ecommerce'),
                readCount,
              )}
            />
          )}
          {writeCount > 0 && (
            <ModeLabel
              isWrite
              label={sprintf(
                /* translators: %d: number of write abilities */
                __('%d write', 'kirki-ecommerce'),
                writeCount,
              )}
            />
          )}
        </Flex>
      }
      rightActions={
        <Switch
          checked={isOn}
          aria-label={group.label}
          onCheckedChange={(checked) => onToggleGroup(group.id, checked)}
        />
      }
    >
      <StackedItems cssOverride={styles.abilityStack}>
        {group.abilities.map(renderAbility)}
      </StackedItems>
    </OptionAccordion>
  );
};

AbilityGroup.displayName = 'AbilityGroup';

export default AbilityGroup;

const styles = defineStyles({
  accordion: {
    backgroundColor: theme.colors.background.surface,
  },
  abilityStack: {
    border: 'none',
    borderRadius: theme.radius.none,
  },
  abilityRow: {
    paddingInline: theme.spacing[4],
    '& [data-ability-info]': {
      opacity: 0,
      transition: 'opacity 150ms ease',
    },
    '&:hover [data-ability-info], &:focus-within [data-ability-info]': {
      opacity: 1,
    },
  },
  infoIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    flexShrink: 0,
    color: theme.colors.icon.secondary,
    cursor: 'help',
  },
  kindIcon: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    width: '26px',
    height: '26px',
    borderRadius: theme.radius.md,
    color: theme.colors.icon.secondary,
    backgroundColor: theme.colors.background.surfaceAlt,
  },
  blockedRow: {
    '& [data-slot="item-title"]': {
      opacity: 0.6,
    },
  },
  mode: {
    ...theme.typography.tiny(),
    display: 'inline-flex',
    alignItems: 'center',
    gap: theme.spacing[1],
    color: theme.colors.text.secondary,
    whiteSpace: 'nowrap',
  },
  dot: {
    display: 'inline-block',
    width: '6px',
    height: '6px',
    borderRadius: theme.radius.full,
  },
  readDot: {
    backgroundColor: theme.colors.icon.success,
  },
  writeDot: {
    backgroundColor: theme.colors.icon.warning,
  },
});
