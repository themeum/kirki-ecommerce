import { useMemo, useState } from 'react';
import { useLocation } from 'react-router';

import Container from '@/components/ui/container';
import Flex from '@/components/ui/flex';
import PageHeading from '@/components/ui/page-heading';
import Searchbox from '@/components/ui/searchbox';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { scoped, defineStyles } from '@/theme/mixins';
import { __ } from '@/wpi18n';

import { SettingsItem } from '@/pages/settings/settings-item';
import { advancedSettings, businessOperationSettings, storeManagementSettings, type SettingsNavItem } from '@/pages/settings/utils';

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

const Settings = () => {
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
    <>
      <PageHeading
        text={__('Settings', 'kirki-ecommerce')}
        size="sm"
        sticky
        type="primary"
        style={{ height: '32px' }}
      />
      <Container size="sm">
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
                  <Text variant="small" color="subdued">
                    {section.title}
                  </Text>
                  <Flex direction="column" cssOverride={styles.itemList}>
                    {section.items.map((item, index) => (
                      <SettingsItem
                        key={item.header}
                        {...item}
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
      </Container>
    </>
  );
};

Settings.displayName = 'Settings';

export default Settings;

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
