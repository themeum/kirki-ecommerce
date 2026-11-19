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
import { defineStyles, mergeCss, scoped } from '@/theme/mixins';

type StackedItemsElementProps = Omit<ComponentPropsWithoutRef<'div'>, 'className' | 'css'> & {
  cssOverride?: CSSObject;
  variant?: 'outline' | 'card' | 'ghost';
};

type StackedItemsContextValue = {
  openId: string | null;
  setOpenId: (id: string | null) => void;
};

const StackedItemsContext = createContext<StackedItemsContextValue | null>(null);

const StackedItems = forwardRef<HTMLDivElement, StackedItemsElementProps>((props, ref) => {
  const { cssOverride, variant = 'outline', ...rest } = props;
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <StackedItemsContext.Provider value={{ openId, setOpenId }}>
      <ItemGroup
        ref={ref}
        data-slot="stacked-items"
        cssOverride={mergeCss(
          styles.container,
          variant === 'card' && styles.cardContainer,
          variant === 'ghost' && styles.ghostContainer,
          cssOverride,
        )}
        {...rest}
      />
    </StackedItemsContext.Provider>
  );
});

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
      <div css={scoped(styles.stackedItem)}>
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
      </div>
    </StackedItemContext.Provider>
  );
});

StackedItem.displayName = 'StackedItem';

const StackedItemMedia = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ItemMedia>>(
  (props, ref) => <ItemMedia ref={ref} {...props} />,
);

StackedItemMedia.displayName = 'StackedItemMedia';

const StackedItemContent = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ItemContent>>(
  (props, ref) => <ItemContent ref={ref} {...props} />,
);

StackedItemContent.displayName = 'StackedItemContent';

const StackedItemTitle = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ItemTitle>>(
  (props, ref) => <ItemTitle ref={ref} {...props} />,
);

StackedItemTitle.displayName = 'StackedItemTitle';

const StackedItemActions = forwardRef<HTMLDivElement, ComponentPropsWithoutRef<typeof ItemActions>>(
  (props, ref) => <ItemActions ref={ref} {...props} />,
);

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
    borderRadius: theme.radius.xl,
    backgroundColor: 'transparent',
    border: `1px solid ${theme.colors.border.secondary}`,
  },
  cardContainer: {
    borderColor: theme.colors.border.secondary,
    '& [data-slot="stacked-item"]': {
      backgroundColor: theme.colors.background.fill,
    },
  },
  ghostContainer: {
    border: 'none',
    borderRadius: theme.radius.none,
    overflow: 'auto',
    marginInline: `-${theme.spacing[2]}`,
    paddingInline: theme.spacing[2],
    '& [data-slot="stacked-item"]': {
      paddingInline: theme.spacing[0],
      '&:hover': {
        backgroundColor: 'rgba(0, 0, 0, 0.02)', // @todo: we don't have any color token for this
      },
      '& a:focus': {
        outline: 'none',
        boxShadow: 'none',
      },
      '&:has(a:focus-visible)::after': {
        content: '""',
        position: 'absolute',
        inset: `${theme.spacing[1]} -${theme.spacing[2]}`,
        border: `2px solid ${theme.colors.background.fillBrand}`,
        borderRadius: theme.radius.lg,
        pointerEvents: 'none',
      },
    },
  },
  stackedItem: {
    padding: 0,
    '&:not(:last-of-type)': {
      borderBottom: `1px solid ${theme.colors.border.secondary}`,
    },
  },
  row: {
    position: 'relative',
    height: '34px',
    padding: `${theme.spacing[1]} ${theme.spacing[1]} ${theme.spacing[1]} ${theme.spacing[3]}`,

    '&:hover': {
      backgroundColor: 'rgba(0, 0, 0, 0.02)', // @todo: we don't have any color token for this
    },
    '& [data-action-group="true"]': {
      position: 'absolute',
      right: theme.spacing[3],
      top: '50%',
      transform: 'translateY(-50%)',
      pointerEvents: 'none',
      opacity: 0,
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
    '& button:not([role="switch"])': {
      width: '28px',
      height: '28px',

      '& svg': {
        width: '14px',
        height: '14px',
        color: theme.colors.icon.primary,
      },
    },
  },
});
