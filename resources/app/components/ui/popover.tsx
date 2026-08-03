import type { CSSObject } from '@emotion/react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { ComponentRef, forwardRef, type ComponentPropsWithoutRef } from 'react';

import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { defineStyles, scopedMerge } from '@/theme/mixins';
import { getOverlayMotionStyles } from '@/theme/overlay-motion';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

type PopoverContentProps = Omit<
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
  'className'
> & {
  cssOverride?: CSSObject;
};

const PopoverContent = forwardRef<
  ComponentRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>((props, ref) => {
  const { cssOverride, align = 'center', sideOffset = 4, ...rest } = props;

  return (
    <PopoverPrimitive.Portal container={getPortalContainer()}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        css={scopedMerge(styles.content, cssOverride)}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
});

PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverAnchor, PopoverContent, PopoverTrigger };

const styles = defineStyles({
  content: {
    width: 'max-content',
    minWidth: '224px',
    maxWidth: '320px',
    padding: theme.spacing[3],
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.fill,
    boxShadow: theme.shadow.md,
    boxSizing: 'border-box',
    ...theme.typography.small(),
    color: theme.colors.text.primary,
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing[1],
    ...getOverlayMotionStyles(
      'var(--radix-popover-content-transform-origin)',
    ),
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
    strong: {
      display: 'block',
      ...theme.typography.small('semibold'),
      color: theme.colors.text.primary,
    },
    p: {
      margin: 0,
      ...theme.typography.small(),
      color: theme.colors.text.secondary,
    },
  },
});
