import type { CSSObject } from '@emotion/react';
import { Slot } from '@radix-ui/react-slot';
import { forwardRef, type ComponentPropsWithoutRef } from 'react';

import { Separator } from '@/components/ui/separator';
import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';

type ItemVariant = 'default' | 'outline' | 'muted';
type ItemSize = 'default' | 'sm';
type ItemMediaVariant = 'default' | 'icon' | 'image';

type ItemElementProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const ItemGroup = forwardRef<HTMLDivElement, ItemElementProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <div
      ref={ref}
      role="list"
      data-slot="item-group"
      css={scopedMerge(styles.group, cssOverride)}
      {...rest}
    />
  );
});

ItemGroup.displayName = 'ItemGroup';

type ItemSeparatorProps = Omit<
  ComponentPropsWithoutRef<typeof Separator>,
  'orientation'
>;

const ItemSeparator = forwardRef<HTMLDivElement, ItemSeparatorProps>(
  (props, ref) => {
    return (
      <Separator
        ref={ref}
        data-slot="item-separator"
        orientation="horizontal"
        {...props}
      />
    );
  },
);

ItemSeparator.displayName = 'ItemSeparator';

type ItemProps = ItemElementProps & {
  variant?: ItemVariant;
  size?: ItemSize;
  asChild?: boolean;
};

const Item = forwardRef<HTMLDivElement, ItemProps>((props, ref) => {
  const {
    cssOverride,
    variant = 'default',
    size = 'default',
    asChild = false,
    ...rest
  } = props;

  const Component = asChild ? Slot : 'div';

  return (
    <Component
      ref={ref}
      data-slot="item"
      data-variant={variant}
      data-size={size}
      css={scopedMerge(
        styles.item,
        styles.itemVariants[variant],
        styles.itemSizes[size],
        cssOverride,
      )}
      {...rest}
    />
  );
});

Item.displayName = 'Item';

type ItemMediaProps = ItemElementProps & {
  variant?: ItemMediaVariant;
};

const ItemMedia = forwardRef<HTMLDivElement, ItemMediaProps>((props, ref) => {
  const { cssOverride, variant = 'default', ...rest } = props;

  return (
    <div
      ref={ref}
      data-slot="item-media"
      data-variant={variant}
      css={scopedMerge(
        styles.media,
        styles.mediaVariants[variant],
        cssOverride,
      )}
      {...rest}
    />
  );
});

ItemMedia.displayName = 'ItemMedia';

const ItemContent = forwardRef<HTMLDivElement, ItemElementProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <div
        ref={ref}
        data-slot="item-content"
        css={scopedMerge(styles.content, cssOverride)}
        {...rest}
      />
    );
  },
);

ItemContent.displayName = 'ItemContent';

const ItemTitle = forwardRef<HTMLDivElement, ItemElementProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <div
      ref={ref}
      data-slot="item-title"
      css={scopedMerge(styles.title, cssOverride)}
      {...rest}
    />
  );
});

ItemTitle.displayName = 'ItemTitle';

type ItemDescriptionProps = Omit<
  ComponentPropsWithoutRef<'p'>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
};

const ItemDescription = forwardRef<HTMLParagraphElement, ItemDescriptionProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <p
        ref={ref}
        data-slot="item-description"
        css={scopedMerge(styles.description, cssOverride)}
        {...rest}
      />
    );
  },
);

ItemDescription.displayName = 'ItemDescription';

const ItemActions = forwardRef<HTMLDivElement, ItemElementProps>(
  (props, ref) => {
    const { cssOverride, ...rest } = props;

    return (
      <div
        ref={ref}
        data-slot="item-actions"
        css={scopedMerge(styles.actions, cssOverride)}
        {...rest}
      />
    );
  },
);

ItemActions.displayName = 'ItemActions';

const ItemHeader = forwardRef<HTMLDivElement, ItemElementProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <div
      ref={ref}
      data-slot="item-header"
      css={scopedMerge(styles.header, cssOverride)}
      {...rest}
    />
  );
});

ItemHeader.displayName = 'ItemHeader';

const ItemFooter = forwardRef<HTMLDivElement, ItemElementProps>((props, ref) => {
  const { cssOverride, ...rest } = props;

  return (
    <div
      ref={ref}
      data-slot="item-footer"
      css={scopedMerge(styles.footer, cssOverride)}
      {...rest}
    />
  );
});

ItemFooter.displayName = 'ItemFooter';

export {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemFooter,
  ItemGroup,
  ItemHeader,
  ItemMedia,
  ItemSeparator,
  ItemTitle
};

export type {
  ItemDescriptionProps,
  ItemMediaProps,
  ItemMediaVariant,
  ItemProps,
  ItemSize,
  ItemVariant
};

const styles = defineStyles({
  group: {
    display: 'flex',
    flexDirection: 'column',
  },
  item: {
    display: 'flex',
    alignItems: 'center',
    flexWrap: 'wrap',
    border: '1px solid transparent',
    borderRadius: theme.radius.md,
    color: theme.colors.text.primary,
    ...theme.typography.small(),
    transition: 'background-color 100ms ease, border-color 100ms ease',
    '&:focus-visible': {
      outline: `2px solid ${theme.colors.background.fillBrand}`,
      outlineOffset: '2px',
    },
    'a&:hover': {
      backgroundColor: theme.colors.background.fillHover,
    },
    '& svg': {
      pointerEvents: 'none',
    },
  },
  itemVariants: {
    default: {
      backgroundColor: 'transparent',
    },
    outline: {
      borderColor: theme.colors.border.default,
    },
    muted: {
      backgroundColor: theme.colors.background.surfaceSecondary,
    },
  },
  itemSizes: {
    default: {
      padding: theme.spacing[4],
      gap: theme.spacing[4],
    },
    sm: {
      padding: `${theme.spacing[3]} ${theme.spacing[4]}`,
      gap: theme.spacing[2],
    },
  },
  media: {
    display: 'flex',
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing[2],
    color: theme.colors.icon.primary,
    '[data-slot="item"]:has([data-slot="item-description"]) &': {
      alignSelf: 'flex-start',
      transform: 'translateY(2px)',
    },
  },
  mediaVariants: {
    default: {
      backgroundColor: 'transparent',
    },
    icon: {
      height: '32px',
      width: '32px',
      borderRadius: theme.radius.sm,
      border: `1px solid ${theme.colors.border.default}`,
      backgroundColor: theme.colors.background.surfaceSecondary,
      '& svg': {
        height: '16px',
        width: '16px',
      },
    },
    image: {
      height: '40px',
      width: '40px',
      borderRadius: theme.radius.sm,
      overflow: 'hidden',
      '& img': {
        height: '100%',
        width: '100%',
        objectFit: 'cover',
      },
    },
  },
  content: {
    display: 'flex',
    flex: 1,
    flexDirection: 'column',
    gap: theme.spacing[1],
    '& + [data-slot="item-content"]': {
      flex: 'none',
    },
  },
  title: {
    display: 'flex',
    width: 'fit-content',
    alignItems: 'center',
    gap: theme.spacing[2],
    ...theme.typography.small('medium'),
  },
  description: {
    margin: 0,
    ...theme.typography.small(),
    color: theme.colors.text.subdued,
    '& a': {
      textDecoration: 'underline',
      textUnderlineOffset: '4px',
    },
    '& a:hover': {
      color: theme.colors.text.primary,
    },
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: theme.spacing[2],
  },
  header: {
    display: 'flex',
    flexBasis: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[2],
  },
  footer: {
    display: 'flex',
    flexBasis: '100%',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: theme.spacing[2],
  },
});
