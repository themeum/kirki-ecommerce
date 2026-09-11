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
    });

    if (location.pathname !== result.route) {
      void navigate(result.route);
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
    >
      <Flex gap={2} align="center" cssOverride={styles.content}>
        <span css={scoped(styles.iconWrap)} data-settings-icon>
          {result.icon}
        </span>
        <Flex direction="column" gap={0} cssOverride={styles.labels}>
          <Text variant="small" weight="medium" cssOverride={styles.title}>
            <HighlightedText text={result.title} terms={result.matchedTerms} />
          </Text>
          <Text variant="tiny" color="subdued" cssOverride={styles.title}>
            {result.pageTitle}
          </Text>
        </Flex>
      </Flex>
    </div>
  );
};

SearchResultRow.displayName = 'SearchResultRow';

export default SearchResultRow;

const styles = defineStyles({
  row: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
    padding: `${theme.spacing[1]} ${theme.spacing[2]}`,
    cursor: 'pointer',
    borderRadius: theme.radius.lg,
    backgroundColor: theme.colors.background.fill,
    '&:hover, &:focus-visible': {
      backgroundColor: theme.colors.background.fillSecondary,
    },
  },
  content: {
    flex: 1,
    minWidth: 0,
  },
  labels: {
    minWidth: 0,
  },
  title: {
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
    '& svg': {
      width: 16,
      height: 16,
    },
  },
});
