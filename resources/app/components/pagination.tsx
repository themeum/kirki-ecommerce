import { type SerializedStyles } from '@emotion/react';

import ActionGroup from '@/components/ui/action-group';
import Button from '@/components/ui/button';
import Flex from '@/components/ui/flex';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Text from '@/components/ui/text';
import { ArrowLeftIcon } from '@/icons';
import { theme } from '@/theme';
import { defineStyles, itemCenter, scopedMerge } from '@/theme/mixins';
import type { PaginationData } from '@/types';
import { __ } from '@/wpi18n';

type PaginationProps = {
  data: PaginationData;
  onChange: (page: number) => void;
  css?: SerializedStyles;
};

const Pagination = (props: PaginationProps) => {
  const { data, onChange, css: cssProp } = props;
  const {
    current_page,
    last_page,
    total,
  } = data;

  const pagesArray = [...Array(last_page)].map((_, i) => ({
    title: `${i + 1}`,
    value: i + 1,
  }));

  const _current_page = current_page * 1;

  if (total == 0) {
    return null;
  }

  return (
    <div css={scopedMerge(styles.wrapper, cssProp)}>
      <Flex gap={2} align="center">
        <Text variant="small">{__('Page', 'kirki-ecommerce')}</Text>
        <Select
          value={String(_current_page)}
          onValueChange={(value) => onChange(Number(value))}
        >
          <SelectTrigger style={{ minWidth: '58px' }}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pagesArray.map((page) => (
              <SelectItem key={page.value} value={String(page.value)}>
                {page.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Text variant="small" cssOverride={styles.nowrap}>
          {`of ${last_page}`}
        </Text>
      </Flex>
      <ActionGroup>
        <Button
          variant="ghost"
          aria-label={__('Previous page', 'kirki-ecommerce')}
          disabled={_current_page === 1}
          onClick={() => onChange(_current_page - 1)}
        >
          <ArrowLeftIcon />
        </Button>
        {pagesArray.map((page, index) => (
          <Button
            key={index}
            variant={_current_page === page.value ? 'primary' : 'link'}
            onClick={() => onChange(page.value)}
            style={{
              width: '32px',
              height: '32px',
            }}
          >
            {page.title}
          </Button>
        ))}
        <Button
          variant="ghost"
          aria-label={__('Next page', 'kirki-ecommerce')}
          style={{ transform: 'rotate(180deg)' }}
          disabled={_current_page === last_page}
          onClick={() => onChange(_current_page + 1)}
        >
          <ArrowLeftIcon />
        </Button>
      </ActionGroup>
    </div>
  );
};

export default Pagination;

const styles = defineStyles({
  wrapper: {
    ...itemCenter(),
    justifyContent: 'space-between',
    padding: `${theme.spacing[2]} ${theme.spacing[0]} ${theme.spacing[3]} ${theme.spacing[0]}`,
  },
  nowrap: {
    whiteSpace: 'nowrap',
  },
});
