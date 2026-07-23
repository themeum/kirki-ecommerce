import { type SerializedStyles } from '@emotion/react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Button from '@/components/ui/button';
import { ArrowLeftIcon } from '@/icons';
import ActionGroup from '@/components/ui/action-group';
import Flex from '@/components/ui/flex';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { itemCenter, scoped } from '@/theme/mixins';
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
    from,
    total,
  } = data;

  const pagesArray = [...Array(last_page)].map((_, i) => ({
    title: `${i + 1}`,
    value: i + 1,
  }));

  const _current_page = current_page * 1;

  if (_current_page == last_page && last_page == from) {
    return null;
  }

  if (total == 0) {
    return null;
  }

  return (
    <div css={[styles.wrapper, cssProp]}>
      <Flex gap={8} style={{ alignItems: 'center' }}>
        <Text header={__('Page', 'kirki-ecommerce')} type="xsm" />
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
        <Text header={`of ${last_page}`} type="xsm" />
      </Flex>
      <ActionGroup>
        <Button
          variant="ghost"
          size="sm"
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
            size="sm"
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
          size="sm"
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

const styles = {
  wrapper: scoped({
    ...itemCenter(),
    justifyContent: 'space-between',
    padding: `${theme.spacing.base} ${theme.spacing.none} ${theme.spacing.xl} ${theme.spacing.none}`,
  }),
};
