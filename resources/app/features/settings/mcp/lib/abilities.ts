import type { McpAbility, McpAbilityGroup } from '@/features/settings/mcp/schemas/catalog/mcp';
import type { McpSettingsFormPayload } from '@/features/settings/mcp/schemas/forms/mcp-settings-form';

type McpSwitches = McpSettingsFormPayload;

const isGroupOn = (switches: McpSwitches, groupId: string) => {
  return switches.groups[groupId] ?? true;
};

const isBlockedByReadOnly = (switches: McpSwitches, ability: McpAbility) => {
  return switches.read_only && ability.is_write;
};

const isAbilityBlocked = (switches: McpSwitches, groupId: string, ability: McpAbility) => {
  return !isGroupOn(switches, groupId) || isBlockedByReadOnly(switches, ability);
};

const isAbilityOn = (switches: McpSwitches, groupId: string, ability: McpAbility) => {
  if (isAbilityBlocked(switches, groupId, ability)) {
    return false;
  }

  return switches.abilities[ability.name] ?? true;
};

const countGroupAbilitiesOn = (switches: McpSwitches, group: McpAbilityGroup) => {
  return group.abilities.filter((ability) => isAbilityOn(switches, group.id, ability)).length;
};

const countAbilitiesOn = (switches: McpSwitches, catalog: McpAbilityGroup[]) => {
  return catalog.reduce((total, group) => total + countGroupAbilitiesOn(switches, group), 0);
};

const countAbilities = (catalog: McpAbilityGroup[]) => {
  return catalog.reduce((total, group) => total + group.abilities.length, 0);
};

const resetAbilities = (switches: McpSwitches): McpSwitches => {
  return { ...switches, read_only: false, groups: {}, abilities: {} };
};

export {
  countAbilities,
  countAbilitiesOn,
  countGroupAbilitiesOn,
  isAbilityBlocked,
  isAbilityOn,
  isBlockedByReadOnly,
  isGroupOn,
  type McpSwitches,
  resetAbilities,
};
