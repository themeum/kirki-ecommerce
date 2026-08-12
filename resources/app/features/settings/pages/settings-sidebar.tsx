import { useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import Text from '@/components/ui/text';
import { advancedSettings, businessOperationSettings, type SettingsNavItem, storeManagementSettings } from '@/features/settings/lib/utils';
import { SettingsNavItemRow } from '@/features/settings/pages/settings-nav-item';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

type SettingsSection = {
  title: string;
  items: SettingsNavItem[];
};

const settingsSections: SettingsSection[] = [
  {
    title: __('STORE MANAGEMENT', 'kirki-ecommerce'),
    items: storeManagementSettings,
  },
  {
    title: __('BUSINESS OPERATION', 'kirki-ecommerce'),
    items: businessOperationSettings,
  },
  {
    title: __('ADVANCED CONFIGURATION', 'kirki-ecommerce'),
    items: advancedSettings,
  },
];

const filterSettingsItems = (
  items: SettingsNavItem[],
  query: string,
): SettingsNavItem[] => {
  if (!query) {
    return items;
  }

  const search = query.toLowerCase().trim();

  return items.filter((item) => {
    const header = item.header.toLowerCase();
    const subHeader = item.subHeader.toLowerCase();
    return header.includes(search) || subHeader.includes(search);
  });
};

const isSettingsRouteActive = (pathname: string, link: string) => {
  if (!link) {
    return false;
  }
  return pathname === link || pathname.startsWith(`${link}/`);
};

const SettingsSidebar = () => {
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSections = useMemo(() => {
    return settingsSections
      .map((section) => ({
        ...section,
        items: filterSettingsItems(section.items, searchQuery),
      }))
      .filter((section) => section.items.length > 0);
  }, [searchQuery]);

  const handleSearchChange = (value: string | number) => {
    setSearchQuery(String(value));
  };

  return (
    <div css={scoped(styles.panel)}>
      <Flex direction="column" gap={6}>
        <Searchbox value={searchQuery} onChange={handleSearchChange} />
        {filteredSections.length === 0 ? (
          <Text color="subdued">
            {__('No settings found', 'kirki-ecommerce')}
          </Text>
        ) : (
          filteredSections.map((section) => (
            <Flex key={section.title} direction="column" gap={2}>
              <Text variant="tiny" color="secondary">
                {section.title}
              </Text>
              <Flex direction="column" cssOverride={styles.itemList}>
                {section.items.map((item, index) => (
                  <SettingsNavItemRow
                    key={item.header}
                    link={item.link}
                    header={item.header}
                    icon={item.icon}
                    disabled={item.disabled}
                    isFirst={index === 0}
                    isLast={index === section.items.length - 1}
                    isActive={isSettingsRouteActive(
                      location.pathname,
                      item.link,
                    )}
                  />
                ))}
              </Flex>
            </Flex>
          ))
        )}
      </Flex>
    </div>
  );
};

SettingsSidebar.displayName = 'SettingsSidebar';

export default SettingsSidebar;

const styles = defineStyles({
  panel: {
    width: '100%',
    padding: theme.spacing[4],
    borderRadius: theme.radius.xl,
    backgroundColor: theme.colors.background.surfaceSecondary,
    boxShadow:
      '0px -1px 1px 0.5px hsla(0, 0%, 0%, 0.1) inset, 0px 0.5px 1px 0px hsla(0, 0%, 0%, 0.1) inset',
  },
  itemList: {
    gap: '2px',
  },
});
