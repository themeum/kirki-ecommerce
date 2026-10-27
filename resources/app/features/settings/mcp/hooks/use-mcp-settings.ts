import { useCallback, useEffect, useRef, useState } from 'react';

import type { McpSwitches } from '@/features/settings/mcp/lib/abilities';
import type { McpSettings } from '@/features/settings/mcp/schemas/catalog/mcp';
import { McpSettingsFormSchema } from '@/features/settings/mcp/schemas/forms/mcp-settings-form';
import { useSettingsQuery, useUpdateSettingsMutation } from '@/services/settings';

const toSwitches = (settings?: McpSettings): McpSwitches => {
  return McpSettingsFormSchema.parse({
    enabled: settings?.enabled ?? false,
    read_only: settings?.read_only ?? false,
    groups: settings?.groups ?? {},
    abilities: settings?.abilities ?? {},
  });
};

const useMcpSettings = () => {
  const { data: settings, isLoading } = useSettingsQuery('mcp');
  const { mutateAsync: updateSettings } = useUpdateSettingsMutation<'mcp'>();
  const [switches, setSwitches] = useState<McpSwitches>(() => toSwitches());

  /**
   * Each commit reads the previous switches from a ref rather than state so
   * that two toggles fired before React re-renders build on each other
   * instead of the second overwriting the first.
   */
  const switchesRef = useRef<McpSwitches>(switches);

  useEffect(() => {
    const next = toSwitches(settings);

    setSwitches(next);
    switchesRef.current = next;
  }, [settings]);

  const commit = useCallback(
    async (updater: (previous: McpSwitches) => McpSwitches) => {
      const previous = switchesRef.current;
      const next = updater(previous);

      setSwitches(next);
      switchesRef.current = next;

      try {
        await updateSettings({ key: 'mcp', data: McpSettingsFormSchema.parse(next) });
      } catch {
        setSwitches(previous);
        switchesRef.current = previous;
      }
    },
    [updateSettings],
  );

  return { settings, switches, isLoading, commit };
};

export default useMcpSettings;
