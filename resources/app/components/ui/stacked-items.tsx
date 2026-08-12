import type { CSSObject } from '@emotion/react';
import {
  type ComponentPropsWithoutRef,
  createContext,
  forwardRef,
  useContext,
  useState,
} from 'react';

import {
  Item,
  ItemActions,
  ItemContent,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from '@/components/ui/item';
import { theme } from '@/theme';
import { defineStyles, mergeCss } from '@/theme/mixins';

type StackedItemsElementProps = Omit<
  ComponentPropsWithoutRef<'div'>,
  'className' | 'css'
> & {
  cssOverride?: CSSObject;
  variant?: 'outline' | 'card';
};

type StackedItemsContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const StackedItemsContext = createContext<StackedItemsContextValue | null>(null);

const StackedItems = forwardRef<HTMLDivElement, StackedItemsElementProps>(
  (props, ref) => {
    const { cssOverride, variant = 'outline', ...rest } = props;
    const [openId, setOpenId] = useState<string | null>(null);

    return (
      <StackedItemsContext.Provider value={{ openId, setOpenId }}>
        <ItemGroup
          ref={ref}
          data-slot="stacked-items"
          cssOverride={mergeCss(styles.container, variant === 'card' && styles.cardContainer, cssOverride)}
          {...rest}
        />
      </StackedItemsContext.Provider>
    );
  },
);

StackedItems.displayName = 'StackedItems';

type StackedItemContextValue = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
};

const StackedItemContext = createContext<StackedItemContextValue | null>(null);

const useStackedItem = () => {
  const context = useContext(StackedItemContext);

  if (!context) {
    throw new Error('useStackedItem must be used within a StackedItem');
  }

  return context;
};

type StackedItemProps = StackedItemsElementProps & {
  id: string;
};

const StackedItem = forwardRef<HTMLDivElement, StackedItemProps>((props, ref) => {
  const { id, cssOverride, children, variant: _variant = 'default', ...rest } = props;
  const stackedItems = useContext(StackedItemsContext);

  if (!stackedItems) {
    throw new Error('StackedItem must be used within StackedItems');
  }

  const isOpen = stackedItems.openId === id;
  const setOpen = (open: boolean) => {
    stackedItems.setOpenId(open ? id : null);
  };

  return (
    <StackedItemContext.Provider value={{ isOpen, setOpen }}>
      <Item
        ref={ref}
        role="listitem"
        size="sm"
        data-slot="stacked-item"
        data-actions-open={isOpen ? 'true' : undefined}
        cssOverride={mergeCss(styles.row, cssOverride)}
        {...rest}
      >
        {children}
      </Item>
    </StackedItemContext.Provider>
  );
});

StackedItem.displayName = 'StackedItem';

const StackedItemMedia = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ItemMedia>
>((props, ref) => <ItemMedia ref={ref} {...props} />);

StackedItemMedia.displayName = 'StackedItemMedia';

const StackedItemContent = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ItemContent>
>((props, ref) => <ItemContent ref={ref} {...props} />);

StackedItemContent.displayName = 'StackedItemContent';

const StackedItemTitle = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ItemTitle>
>((props, ref) => <ItemTitle ref={ref} {...props} />);

StackedItemTitle.displayName = 'StackedItemTitle';

const StackedItemActions = forwardRef<
  HTMLDivElement,
  ComponentPropsWithoutRef<typeof ItemActions>
>((props, ref) => <ItemActions ref={ref} {...props} />);

StackedItemActions.displayName = 'StackedItemActions';

export {
  StackedItem,
  StackedItemActions,
  StackedItemContent,
  StackedItemMedia,
  StackedItems,
  StackedItemTitle,
  useStackedItem,
};

export type { StackedItemProps, StackedItemsElementProps };

const styles = defineStyles({
  container: {
    overflow: 'hidden',
    border: `1px solid ${theme.colors.border.alt}`,
    borderRadius: theme.radius.md,
  },
  cardContainer: {
    borderColor: theme.colors.border.secondary,
    '& [data-slot="stacked-item"]': {
      backgroundColor: theme.colors.background.fill,
    },
  },
  row: {
    position: 'relative',
    minHeight: '44px',
    borderRadius: theme.radius.none,
    padding: `${theme.spacing[2]} ${theme.spacing[3]}`,
    '&:not(:last-of-type)': {
      borderBottom: `1px solid ${theme.colors.border.default}`,
    },
    '&:first-of-type': {
      borderTopLeftRadius: theme.radius.md,
      borderTopRightRadius: theme.radius.md,
    },
    '&:last-of-type': {
      borderBottomLeftRadius: theme.radius.md,
      borderBottomRightRadius: theme.radius.md,
    },
    '& [data-action-group="true"]': {
      position: 'absolute',
      right: theme.spacing[4],
      top: '50%',
      transform: 'translateY(-50%)',
      opacity: 0,
      pointerEvents: 'none',
    },
    '&:hover [data-action-group="true"], &:focus-within [data-action-group="true"], &[data-actions-open="true"] [data-action-group="true"]':
    {
      opacity: 1,
      pointerEvents: 'auto',
    },
    '&:hover [data-right-text="true"], &:focus-within [data-right-text="true"], &[data-actions-open="true"] [data-right-text="true"]':
    {
      visibility: 'hidden',
    },
  },
});
