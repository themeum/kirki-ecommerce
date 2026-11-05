import { keyframes } from '@emotion/react';

import { theme } from '@/theme';
import { defineStyles, scoped } from '@/theme/mixins';

const NotFoundIllustration = () => {
  return (
    <svg
      css={scoped(styles.svg)}
      viewBox="0 0 440 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse
        css={scoped(styles.shadow)}
        cx="220"
        cy="316"
        rx="132"
        ry="16"
        fill={theme.colors.border.secondary}
        fillOpacity="0.45"
      />

      <g css={scoped(styles.parcel)}>
        <path
          d="M110 140L220 96L330 140V262L220 306L110 262Z"
          fill={theme.colors.background.fillSecondary}
          stroke={theme.colors.background.fillBrand}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path
          d="M110 140L220 184L330 140"
          stroke={theme.colors.background.fillBrand}
          strokeWidth="3"
          strokeLinejoin="round"
        />
        <path d="M220 184V306" stroke={theme.colors.background.fillBrand} strokeWidth="3" />
        <path d="M110 140L220 184V306L110 262Z" fill={theme.colors.background.fillSecondaryHover} />
        <path
          d="M178 118L288 162V184L178 140Z"
          fill={theme.colors.background.fillBrand}
          fillOpacity="0.85"
        />

        <g transform="translate(236 214) rotate(-6)">
          <rect
            width="72"
            height="56"
            rx="6"
            fill={theme.colors.background.surface}
            stroke={theme.colors.border.secondary}
            strokeWidth="2"
          />
          <text
            x="36"
            y="40"
            textAnchor="middle"
            fontSize="34"
            fontWeight="700"
            fill={theme.colors.icon.critical}
          >
            ?
          </text>
          <rect x="10" y="10" width="34" height="4" rx="2" fill={theme.colors.border.secondary} />
          <rect x="10" y="18" width="22" height="4" rx="2" fill={theme.colors.border.secondary} />
        </g>
      </g>

      <circle cx="84" cy="96" r="6" fill={theme.colors.background.fillBrand} fillOpacity="0.5" />
      <circle cx="372" cy="84" r="4" fill={theme.colors.background.fillBrand} fillOpacity="0.4" />
      <path
        d="M360 232C368 224 378 228 384 238"
        stroke={theme.colors.border.secondary}
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};

NotFoundIllustration.displayName = 'NotFoundIllustration';

export default NotFoundIllustration;

const FLOAT_DISTANCE = 10;
const FLOAT_DURATION = '3.6s';

const floatParcel = keyframes({
  '0%, 100%': { transform: 'translateY(0)' },
  '50%': { transform: `translateY(-${FLOAT_DISTANCE}px)` },
});

const floatShadow = keyframes({
  '0%, 100%': { transform: 'scale(1)', opacity: 1 },
  '50%': { transform: 'scale(0.82)', opacity: 0.55 },
});

const styles = defineStyles({
  parcel: {
    animation: `${floatParcel} ${FLOAT_DURATION} ease-in-out infinite`,
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
  shadow: {
    transformBox: 'fill-box',
    transformOrigin: 'center',
    animation: `${floatShadow} ${FLOAT_DURATION} ease-in-out infinite`,
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  },
  svg: {
    width: '100%',
    maxWidth: '440px',
    height: 'auto',
    overflow: 'visible',
    transform: 'perspective(900px) rotateX(var(--tilt-x, 0deg)) rotateY(var(--tilt-y, 0deg))',
    transition: 'transform 180ms ease-out',
    '@media (prefers-reduced-motion: reduce)': {
      transition: 'none',
    },
    '@media (max-width: 768px)': {
      maxWidth: '320px',
    },
  },
});
