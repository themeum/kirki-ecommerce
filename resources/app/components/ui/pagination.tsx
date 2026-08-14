import { type CSSObject } from '@emotion/react';
import { type ComponentPropsWithoutRef, createContext, forwardRef, useContext } from 'react';

import Flex from '@/components/ui/flex';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Text from '@/components/ui/text';
import { theme } from '@/theme';
import { defineStyles, flexCenter, itemCenter, scopedMerge, uiFocusRing } from '@/theme/mixins';
import { __, sprintf } from '@/wpi18n';

const PaginationDisabledContext = createContext(false);

type PaginationProps = Omit<ComponentPropsWithoutRef<'nav'>, 'className' | 'css'> & {
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const Pagination = forwardRef<HTMLElement, PaginationProps>((props, ref) => {
  const { disabled = false, cssOverride, 'aria-label': ariaLabel, ...rest } = props;

  return (
    <PaginationDisabledContext.Provider value={disabled}>
      <nav
        ref={ref}
        aria-label={ariaLabel ?? __('Pagination', 'kirki-ecommerce')}
        css={scopedMerge(styles.nav, cssOverride)}
        {...rest}
      />
    </PaginationDisabledContext.Provider>
  );
});

Pagination.displayName = 'Pagination';

type PaginationContentProps = Omit<ComponentPropsWithoutRef<'ul'>, 'className' | 'css'> & {
  cssOverride?: CSSObject;
};

const PaginationContent = forwardRef<HTMLUListElement, PaginationContentProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return <ul ref={ref} css={scopedMerge(styles.content, cssOverride)} {...rest} />;
  },
);

PaginationContent.displayName = 'PaginationContent';

type PaginationItemProps = Omit<ComponentPropsWithoutRef<'li'>, 'className' | 'css'> & {
  cssOverride?: CSSObject;
};

const PaginationItem = forwardRef<HTMLLIElement, PaginationItemProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return <li ref={ref} css={scopedMerge(cssOverride)} {...rest} />;
  },
);

PaginationItem.displayName = 'PaginationItem';

type PaginationLinkProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'className' | 'css' | 'type'
> & {
  isActive?: boolean;
  cssOverride?: CSSObject;
};

const PaginationLink = forwardRef<HTMLButtonElement, PaginationLinkProps>(
  (props, ref) => {
    const { isActive, disabled, cssOverride, ...rest } = props;
    const contextDisabled = useContext(PaginationDisabledContext);

    return (
      <button
        ref={ref}
        type="button"
        disabled={Boolean(disabled) || contextDisabled}
        aria-current={isActive ? 'page' : undefined}
        data-active={isActive ? 'true' : undefined}
        css={scopedMerge(styles.link, isActive && styles.linkActive, cssOverride)}
        {...rest}
      />
    );
  },
);

PaginationLink.displayName = 'PaginationLink';

type PaginationPreviousProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'className' | 'css' | 'type'
> & {
  cssOverride?: CSSObject;
};

const PaginationPrevious = forwardRef<HTMLButtonElement, PaginationPreviousProps>(
  (props, ref) => {
    const { disabled, cssOverride, children, ...rest } = props;
    const contextDisabled = useContext(PaginationDisabledContext);

    return (
      <button
        ref={ref}
        type="button"
        aria-label={__('Previous page', 'kirki-ecommerce')}
        disabled={Boolean(disabled) || contextDisabled}
        css={scopedMerge(styles.link, styles.navLink, cssOverride)}
        {...rest}
      >
        {children ?? __('Prev', 'kirki-ecommerce')}
      </button>
    );
  },
);

PaginationPrevious.displayName = 'PaginationPrevious';

type PaginationNextProps = Omit<
  ComponentPropsWithoutRef<'button'>,
  'className' | 'css' | 'type'
> & {
  cssOverride?: CSSObject;
};

const PaginationNext = forwardRef<HTMLButtonElement, PaginationNextProps>(
  (props, ref) => {
    const { disabled, cssOverride, children, ...rest } = props;
    const contextDisabled = useContext(PaginationDisabledContext);

    return (
      <button
        ref={ref}
        type="button"
        aria-label={__('Next page', 'kirki-ecommerce')}
        disabled={Boolean(disabled) || contextDisabled}
        css={scopedMerge(styles.link, styles.navLink, cssOverride)}
        {...rest}
      >
        {children ?? __('Next', 'kirki-ecommerce')}
      </button>
    );
  },
);

PaginationNext.displayName = 'PaginationNext';

type PaginationEllipsisProps = Omit<ComponentPropsWithoutRef<'span'>, 'className' | 'css'> & {
  cssOverride?: CSSObject;
};

const PaginationEllipsis = forwardRef<HTMLSpanElement, PaginationEllipsisProps>(
  (props, ref) => {
    const { cssOverride, children, ...rest } = props;

    return (
      <span
        ref={ref}
        aria-hidden="true"
        css={scopedMerge(styles.ellipsis, cssOverride)}
        {...rest}
      >
        {children ?? '…'}
      </span>
    );
  },
);

PaginationEllipsis.displayName = 'PaginationEllipsis';

type PaginationPageSelectProps = {
  currentPage: number;
  totalPages: number;
  onChange: (page: number) => void;
  disabled?: boolean;
  cssOverride?: CSSObject;
};

const PaginationPageSelect = (props: PaginationPageSelectProps) => {
  const { currentPage, totalPages, onChange, disabled, cssOverride } = props;
  const contextDisabled = useContext(PaginationDisabledContext);
  const isDisabled = Boolean(disabled) || contextDisabled;

  return (
    <Flex gap={2} align="center" cssOverride={cssOverride}>
      <Text variant="small">{__('Page', 'kirki-ecommerce')}</Text>
      <Select
        value={String(currentPage)}
        onValueChange={(value) => onChange(Number(value))}
        disabled={isDisabled}
      >
        <SelectTrigger style={{ minWidth: '58px' }}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <SelectItem key={page} value={String(page)}>
              {page}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Text variant="small" cssOverride={styles.nowrap}>
        {
          /* translators: %s: last page */
          sprintf(__('of %s', 'kirki-ecommerce'), totalPages)
        }
      </Text>
    </Flex>
  );
};

PaginationPageSelect.displayName = 'PaginationPageSelect';

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPageSelect,
  PaginationPrevious,
};

const styles = defineStyles({
  nav: {
    ...itemCenter(),
  },
  content: {
    ...itemCenter(),
    gap: theme.spacing[1],
    listStyle: 'none',
    margin: 0,
    padding: 0,
  },
  link: {
    ...flexCenter(),
    width: theme.spacing[8],
    height: theme.spacing[8],
    padding: 0,
    border: '1px solid transparent',
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.fill,
    color: theme.colors.text.primary,
    cursor: 'pointer',
    ...theme.typography.small(),
    '&:hover:not(:disabled)': {
      backgroundColor: theme.colors.background.fillSpecial3Tertiary,
    },
    '&:focus-visible': {
      ...uiFocusRing(theme),
    },
    '&:disabled': {
      opacity: 0.5,
      cursor: 'not-allowed',
      pointerEvents: 'none',
    },
  },
  linkActive: {
    backgroundColor: theme.colors.background.fillBrand,
    color: theme.colors.text.light,
    '&:hover:not(:disabled)': {
      backgroundColor: theme.colors.background.fillBrandHover,
      color: theme.colors.text.light,
    },
  },
  navLink: {
    width: 'auto',
    padding: `0 ${theme.spacing[3]}`,
  },
  ellipsis: {
    ...flexCenter(),
    width: theme.spacing[8],
    height: theme.spacing[8],
    color: theme.colors.text.secondary,
  },
  nowrap: {
    whiteSpace: 'nowrap',
  },
});
