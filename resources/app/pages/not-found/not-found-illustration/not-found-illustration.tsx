import { theme, getCssVarName } from '@/theme';
import { scoped, defineStyles } from '@/theme/mixins';

const NotFoundIllustration = () => {
  return (
    <svg
      css={scoped(styles.svg)}
      viewBox="0 0 440 360"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <ellipse
        cx="220"
        cy="298"
        rx="176"
        ry="18"
        fill={theme.colors.border.secondary}
        fillOpacity="0.4"
      />
      <path
        d="M118 298H322"
        stroke={theme.colors.border.secondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.35"
      />
      <path
        d="M148 306H292"
        stroke={theme.colors.border.secondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.25"
      />

      <circle
        cx="118"
        cy="118"
        r="34"
        fill={theme.colors.icon.critical}
        fillOpacity="0.85"
      />
      <circle
        cx="118"
        cy="118"
        r="24"
        fill={theme.colors.border.critical}
        fillOpacity="0.55"
      />

      <path
        d="M168 292C168 220 182 156 206 118C228 82 252 72 268 92C284 112 278 168 262 228C246 276 232 298 214 298C196 298 168 292 168 292Z"
        fill={theme.colors.background.fillSecondary}
      />
      <rect
        x="248"
        y="248"
        width="18"
        height="52"
        rx="4"
        fill={theme.colors.text.primary}
        fillOpacity="0.75"
      />
      <path
        d="M258 170C246 188 238 210 234 232"
        stroke={theme.colors.text.primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.35"
      />
      <path
        d="M272 162C282 182 288 204 290 228"
        stroke={theme.colors.text.primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.35"
      />

      <path
        d="M292 298C292 236 304 178 326 142C346 110 372 104 386 126C400 148 392 206 372 258C356 294 342 298 328 298C314 298 292 298 292 298Z"
        fill={theme.colors.background.fillSecondary}
        fillOpacity="0.92"
      />
      <rect
        x="368"
        y="252"
        width="16"
        height="48"
        rx="4"
        fill={theme.colors.text.primary}
        fillOpacity="0.75"
      />
      <path
        d="M378 176C368 194 360 214 356 236"
        stroke={theme.colors.text.primary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.3"
      />

      <ellipse
        cx="186"
        cy="262"
        rx="52"
        ry="64"
        fill={theme.colors.background.fillBrand}
      />
      <path
        d="M166 220C176 248 186 276 196 304"
        stroke={`var(${getCssVarName('brand3')})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
      <path
        d="M186 214C186 246 186 278 186 310"
        stroke={`var(${getCssVarName('brand3')})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />
      <path
        d="M206 220C196 248 186 276 176 304"
        stroke={`var(${getCssVarName('brand3')})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.55"
      />

      <ellipse
        cx="268"
        cy="272"
        rx="44"
        ry="54"
        fill={theme.colors.background.fillBrand}
        fillOpacity="0.92"
      />
      <path
        d="M252 238C260 262 268 286 276 310"
        stroke={`var(${getCssVarName('brand3')})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <path
        d="M268 232C268 260 268 288 268 316"
        stroke={`var(${getCssVarName('brand3')})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />
      <path
        d="M284 240C276 264 268 288 260 312"
        stroke={`var(${getCssVarName('brand3')})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.5"
      />

      <ellipse
        cx="332"
        cy="284"
        rx="36"
        ry="44"
        fill={theme.colors.background.fillBrand}
        fillOpacity="0.88"
      />
      <path
        d="M320 256C326 276 332 296 338 316"
        stroke={`var(${getCssVarName('brand3')})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />
      <path
        d="M332 250C332 274 332 298 332 322"
        stroke={`var(${getCssVarName('brand3')})`}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />

      <circle
        cx="176"
        cy="248"
        r="22"
        fill={theme.colors.text.primary}
        fillOpacity="0.82"
      />
      <circle
        cx="184"
        cy="244"
        r="8"
        fill={theme.colors.background.fill}
      />
      <circle
        cx="186"
        cy="244"
        r="3"
        fill={theme.colors.text.primary}
      />
      <path
        d="M162 232C168 224 176 220 186 222C194 224 200 230 202 236"
        fill={theme.colors.background.fillBrand}
      />

      <circle
        cx="286"
        cy="256"
        r="20"
        fill={theme.colors.text.primary}
        fillOpacity="0.82"
      />
      <circle
        cx="293"
        cy="252"
        r="7"
        fill={theme.colors.background.fill}
      />
      <circle
        cx="295"
        cy="252"
        r="2.5"
        fill={theme.colors.text.primary}
      />
      <path
        d="M274 242C280 234 288 230 296 232C302 234 308 240 310 246"
        fill={theme.colors.background.fillBrand}
      />

      <circle
        cx="72"
        cy="84"
        r="6"
        fill={theme.colors.background.fillSecondaryHover}
        fillOpacity="0.7"
      />
      <circle
        cx="388"
        cy="96"
        r="5"
        fill={theme.colors.background.fillSecondaryHover}
        fillOpacity="0.55"
      />
      <circle
        cx="356"
        cy="68"
        r="4"
        fill={theme.colors.background.fillSecondary}
        fillOpacity="0.65"
      />
      <path
        d="M52 196C62 188 72 192 78 202"
        stroke={theme.colors.border.secondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />
      <path
        d="M382 204C372 196 360 200 354 210"
        stroke={theme.colors.border.secondary}
        strokeWidth="2"
        strokeLinecap="round"
        strokeOpacity="0.45"
      />
    </svg>
  );
};

NotFoundIllustration.displayName = 'NotFoundIllustration';

export default NotFoundIllustration;

const styles = defineStyles({
  svg: {
    width: '100%',
    maxWidth: '440px',
    height: 'auto',
    '@media (max-width: 768px)': {
      maxWidth: '320px',
    },
  },
});
