import type { KeyboardEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';

import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import HighlightedText from '@/features/settings/search/highlighted-text';
import { useSettingsSearchTarget } from '@/features/settings/search/settings-search-context';
import type { SettingsSearchResult } from '@/features/settings/search/use-settings-search';
import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

type SearchResultRowProps = {
  result: SettingsSearchResult;
};

const SearchResultRow = (props: SearchResultRowProps) => {
  const { result } = props;
  const navigate = useNavigate();
  const location = useLocation();
  const { setTarget } = useSettingsSearchTarget();

  const handleSelect = () => {
    setTarget({
      searchId: result.id,
      route: result.route,
      terms: result.matchedTerms,
      prefixes: result.matchedPrefixes,
    });

    if (location.pathname !== result.route) {
      void navigate({ pathname: result.route, search: location.search });
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleSelect();
    }
  };

  return (
    <div
      css={scoped(styles.row)}
      onClick={handleSelect}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      title={`${result.pageTitle} › ${result.title}`}
    >
      <Flex gap={2} align="center" cssOverride={styles.content}>
        <span css={scoped(styles.iconWrap)} data-settings-icon>
          {result.icon}
        </span>
        <Text variant="small" weight="medium" cssOverride={styles.title} data-settings-heading>
          <HighlightedText
            text={result.title}
            terms={result.matchedTerms}
            prefixes={result.matchedPrefixes}
          />
        </Text>
      </Flex>
    </div>
  );
};

SearchResultRow.displayName = 'SearchResultRow';

export default SearchResultRow;

const highlightedRow = defineStyles({
  backgroundColor: theme.colors.background.fillSecondary,
  '& svg': {
    color: theme.colors.background.fillBrand,
  },
});

const highlightedHeading = defineStyles({
  color: theme.colors.background.fillBrand,
});

const highlightedIcon = defineStyles({
  color: theme.colors.background.fillBrand,
});

const styles = defineStyles({
  row: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[2],
    height: '28px',
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    cursor: 'pointer',
    backgroundColor: theme.colors.background.fill,
    borderRadius: theme.radius.lg,
    '&:hover, &:focus-visible': highlightedRow,
    '&:hover [data-settings-heading], &:focus-visible [data-settings-heading]':
      highlightedHeading,
    '&:hover [data-settings-icon], &:focus-visible [data-settings-icon]': highlightedIcon,
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    transition: 'color 0.2s ease',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  iconWrap: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    color: theme.colors.icon.primary,
    transition: 'color 0.2s ease',
    '& svg': {
      width: 16,
      height: 16,
      color: theme.colors.icon.primary,
    },
  },
});
