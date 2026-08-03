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
import { __, sprintf } from '@/wpi18n';
import { useMemo } from 'react';

type PaginationProps = {
  data: PaginationData;
  onChange: (page: number) => void;
  css?: SerializedStyles;
};

const ELLIPSIS = 'ellipsis';

const getPageItems = (current_page: number, last_page: number, siblingCount = 1): (number | typeof ELLIPSIS)[] => {
  const totalPageNumbers = siblingCount * 2 + 5;

  if (totalPageNumbers >= last_page) {
    return [...Array(last_page)].map((_, i) => i + 1);
  }

  const leftSiblingIndex = Math.max(current_page - siblingCount, 1);
  const rightSiblingIndex = Math.min(current_page + siblingCount, last_page);

  const showLeftEllipsis = leftSiblingIndex > 2;
  const showRightEllipsis = rightSiblingIndex < last_page - 1;

  if (!showLeftEllipsis && showRightEllipsis) {
    const leftRangeLength = 3 + siblingCount * 2;
    const leftRange = [...Array(leftRangeLength)].map((_, i) => i + 1);

    return [...leftRange, ELLIPSIS, last_page];
  }

  if (showLeftEllipsis && !showRightEllipsis) {
    const rightRangeLength = 3 + siblingCount * 2;
    const rightRange = [...Array(rightRangeLength)].map((_, i) => last_page - rightRangeLength + i + 1);

    return [1, ELLIPSIS, ...rightRange];
  }

  const middleRange = [...Array(rightSiblingIndex - leftSiblingIndex + 1)].map((_, i) => leftSiblingIndex + i);

  return [1, ELLIPSIS, ...middleRange, ELLIPSIS, last_page];
};

const Pagination = (props: PaginationProps) => {
  const { data, onChange, css: cssProp } = props;
  const {
    current_page,
    last_page,
    total,
  } = data;

  const pagesArray = useMemo(() => {
    return [...Array(last_page)].map((_, i) => ({
      title: `${i + 1}`,
      value: i + 1,
    }));
  }, [last_page]);

  const _current_page = current_page * 1;

  if (total == 0) {
    return null;
  }

  const pageItems = useMemo(() => {
    return getPageItems(_current_page, last_page);
  }, [_current_page, last_page]);

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
          {
            /* translators: %s: last page */
            sprintf(__(`of %s`, 'kirki-ecommerce'), last_page)
          }
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
        {pageItems.map((item, index) => (
          item === ELLIPSIS ? (
            <Button
              key={`ellipsis-${index}`}
              variant="link"
              disabled
              style={{
                width: theme.spacing[8],
                height: theme.spacing[8],
              }}
            >
              …
            </Button>
          ) : (
            <Button
              key={item}
              variant={_current_page === item ? 'primary' : 'link'}
              onClick={() => onChange(item)}
              style={{
                width: theme.spacing[8],
                height: theme.spacing[8],
              }}
            >
              {item}
            </Button>
          )
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
