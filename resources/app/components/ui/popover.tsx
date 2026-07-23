import type { SerializedStyles, Theme } from '@emotion/react';
import {
  forwardRef,
  type ComponentPropsWithoutRef,
  type ElementRef,
} from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';

import { getPortalContainer } from '@/libs/portal-container';
import { theme } from '@/theme';
import { fontGeneralSettings, scoped } from '@/theme/mixins';
import { getOverlayMotionStyles } from '@/theme/overlay-motion';

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverAnchor = PopoverPrimitive.Anchor;

type PopoverContentProps = Omit<
  ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>,
  'className'
> & {
  css?: SerializedStyles;
};

const PopoverContent = forwardRef<
  ElementRef<typeof PopoverPrimitive.Content>,
  PopoverContentProps
>((props, ref) => {
  const { css: cssProp, align = 'center', sideOffset = 4, ...rest } = props;

  return (
    <PopoverPrimitive.Portal container={getPortalContainer()}>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        css={[styles.content, cssProp]}
        {...rest}
      />
    </PopoverPrimitive.Portal>
  );
});

PopoverContent.displayName = 'PopoverContent';

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor };

const styles = {
  content: scoped({
    width: 'max-content',
    minWidth: '224px',
    maxWidth: '320px',
    padding: theme.spacing.lg,
    border: `1px solid ${theme.colors.border.default}`,
    borderRadius: theme.radius.md,
    backgroundColor: theme.colors.background.fill,
    boxShadow: '0px 4px 6px -1px #0000001a',
    boxSizing: 'border-box',
    color: theme.colors.text.primary,
    ...fontGeneralSettings(theme as Theme),
    fontSize: '14px',
    lineHeight: '20px',
    display: 'flex',
    flexDirection: 'column',
    rowGap: theme.spacing.xs,
    ...getOverlayMotionStyles(
      'var(--radix-popover-content-transform-origin)',
    ),
    '&:focus, &:focus-visible': {
      outline: 'none',
    },
    strong: {
      display: 'block',
      fontWeight: 600,
      fontSize: '14px',
      lineHeight: '20px',
      color: theme.colors.text.primary,
    },
    p: {
      margin: 0,
      color: theme.colors.text.secondary,
      fontSize: '14px',
      lineHeight: '20px',
    },
  }),
};
