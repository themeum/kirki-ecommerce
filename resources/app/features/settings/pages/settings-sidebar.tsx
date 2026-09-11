import { useLocation, useSearchParams } from 'react-router';

import Flex from '@/components/ui/flex';
import Searchbox from '@/components/ui/searchbox';
import Text from '@/components/ui/text';
import {
  advancedSettings,
  businessOperationSettings,
  type SettingsNavItem,
  storeManagementSettings,
} from '@/features/settings/lib/utils';
import { SettingsNavItemRow } from '@/features/settings/pages/settings-nav-item';
import SearchResultRow from '@/features/settings/search/search-result-row';
import { useSettingsSearchTarget } from '@/features/settings/search/settings-search-context';
import {
  type SettingsSearchResult,
  useSettingsSearch,
} from '@/features/settings/search/use-settings-search';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';
import { __ } from '@/wpi18n';

const SEARCH_QUERY_PARAM = 'q';

type SettingsSection = {
  title: string;
  items: SettingsNavItem[];
};

const settingsSections: SettingsSection[] = [
  {
    title: __('Store', 'kirki-ecommerce'),
    items: storeManagementSettings,
  },
  {
    title: __('Business', 'kirki-ecommerce'),
    items: businessOperationSettings,
  },
  {
    title: __('Configuration', 'kirki-ecommerce'),
    items: advancedSettings,
  },
];

const isSettingsRouteActive = (pathname: string, link: string) => {
  if (!link) {
    return false;
  }
  return pathname === link || pathname.startsWith(`${link}/`);
};

type SearchResultsProps = {
  results: SettingsSearchResult[];
  isLoading: boolean;
};

const SearchResults = (props: SearchResultsProps) => {
  const { results, isLoading } = props;

  if (isLoading) {
    return null;
  }

  if (results.length === 0) {
    return <Text color="subdued">{__('No results found', 'kirki-ecommerce')}</Text>;
  }

  return (
    <Flex direction="column" gap={1}>
      {results.map((result) => (
        <SearchResultRow key={result.id} result={result} />
      ))}
    </Flex>
  );
};

SearchResults.displayName = 'SearchResults';

const SettingsSidebar = () => {
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const searchQuery = searchParams.get(SEARCH_QUERY_PARAM) ?? '';
  const { results, isSearching, isLoading } = useSettingsSearch(searchQuery);
  const { clearTarget } = useSettingsSearchTarget();

  const handleSearchChange = (value: string | number) => {
    const next = String(value);

    setSearchParams(
      (current) => {
        const updated = new URLSearchParams(current);

        if (next.trim()) {
          updated.set(SEARCH_QUERY_PARAM, next);
        } else {
          updated.delete(SEARCH_QUERY_PARAM);
        }

        return updated;
      },
      { replace: true },
    );

    if (!next.trim()) {
      clearTarget();
    }
  };

  return (
    <div css={scoped(styles.panel)}>
      <Flex direction="column" gap={3}>
        <Searchbox
          value={searchQuery}
          onChange={handleSearchChange}
          cssOverride={styles.searchbox}
        />
        {isSearching ? (
          <SearchResults results={results} isLoading={isLoading} />
        ) : (
          settingsSections.map((section) => (
            <Flex key={section.title} direction="column" gap={2}>
              <Text
                variant="tiny"
                color="secondary"
                weight="medium"
                cssOverride={{ marginLeft: theme.spacing[1] }}
              >
                {section.title}
              </Text>
              <Flex direction="column" gap={1}>
                {section.items.map((item, index) => (
                  <SettingsNavItemRow
                    key={item.header}
                    link={item.link}
                    header={item.header}
                    icon={item.icon}
                    disabled={item.disabled}
                    isFirst={index === 0}
                    isLast={index === section.items.length - 1}
                    isActive={isSettingsRouteActive(location.pathname, item.link)}
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
  searchbox: {
    backgroundColor: theme.colors.background.surfaceAlt,
    border: '1px solid transparent',
    marginBottom: theme.spacing[1],
    color: theme.colors.text.primary,
    '& svg': {
      color: theme.colors.icon.secondary,
    },
    '& input': {
      ...theme.typography.small('medium'),
    },
  },
  panel: {
    width: '100%',
    padding: `${theme.spacing[2]} ${theme.spacing[2]} ${theme.spacing[3]} ${theme.spacing[2]}`,
    border: `1px solid ${theme.colors.border.tertiary}`,
    borderRadius: theme.radius.xxl,
    backgroundColor: theme.colors.background.fill,
    boxShadow: '0px -1px 1px 0.5px rgba(0, 0, 0, 0.1) inset',
  },
});
