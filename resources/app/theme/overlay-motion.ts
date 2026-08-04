import { keyframes, type CSSObject } from '@emotion/react';

import { theme } from '@/theme';

const overlayInFromTop = keyframes({
  from: {
    opacity: 0,
    transform: 'scale(0.95) translateY(-0.5rem)',
  },
  to: {
    opacity: 1,
    transform: 'scale(1) translateY(0)',
  },
});

const overlayInFromBottom = keyframes({
  from: {
    opacity: 0,
    transform: 'scale(0.95) translateY(0.5rem)',
  },
  to: {
    opacity: 1,
    transform: 'scale(1) translateY(0)',
  },
});

const overlayInFromLeft = keyframes({
  from: {
    opacity: 0,
    transform: 'scale(0.95) translateX(-0.5rem)',
  },
  to: {
    opacity: 1,
    transform: 'scale(1) translateX(0)',
  },
});

const overlayInFromRight = keyframes({
  from: {
    opacity: 0,
    transform: 'scale(0.95) translateX(0.5rem)',
  },
  to: {
    opacity: 1,
    transform: 'scale(1) translateX(0)',
  },
});

const overlayOut = keyframes({
  from: {
    opacity: 1,
    transform: 'scale(1)',
  },
  to: {
    opacity: 0,
    transform: 'scale(0.95)',
  },
});

/**
 * Overlay entrance/exit motion matching the SCSS ui-overlay-motion mixin.
 *
 * @param transformOrigin Radix transform-origin CSS variable for the overlay.
 *
 * @returns CSS object animating the overlay based on data-state/data-side attributes.
 */
const getOverlayMotionStyles = (transformOrigin: string): CSSObject => {
  return {
    zIndex: theme.zIndex.dropdown,
    transformOrigin,
    '&[data-state="open"][data-side="bottom"]': {
      animation: `${overlayInFromTop} 150ms ease`,
    },
    '&[data-state="open"][data-side="top"]': {
      animation: `${overlayInFromBottom} 150ms ease`,
    },
    '&[data-state="open"][data-side="left"]': {
      animation: `${overlayInFromRight} 150ms ease`,
    },
    '&[data-state="open"][data-side="right"]': {
      animation: `${overlayInFromLeft} 150ms ease`,
    },
    '&[data-state="closed"]': {
      animation: `${overlayOut} 150ms ease`,
    },
  };
};

export {
  overlayInFromTop,
  overlayInFromBottom,
  overlayInFromLeft,
  overlayInFromRight,
  overlayOut,
  getOverlayMotionStyles,
};
