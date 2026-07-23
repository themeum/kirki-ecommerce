import { Global, css, useTheme } from '@emotion/react';

import { getCssVarName, type PrimitiveColorKey } from '@/theme';
import { getNormalizeStyles } from '@/theme/normalize';
import { getShellStyles } from '@/theme/shell-styles';

/**
 * Injects primitive CSS variables and the app normalize reset via Emotion Global.
 *
 * @returns Global style element for theme variables and normalize rules.
 */
const GlobalStyles = () => {
  const theme = useTheme();
  const primitiveEntries = Object.entries(theme.primitives.colors) as Array<
    [PrimitiveColorKey, string]
  >;

  const cssVariables: Record<string, string> = {};

  for (const [key, value] of primitiveEntries) {
    cssVariables[getCssVarName(key)] = value;
  }

  return (
    <Global
      styles={css({
        ':root': cssVariables,
        ...getShellStyles(theme),
        ...getNormalizeStyles(theme),
      })}
    />
  );
};

GlobalStyles.displayName = 'GlobalStyles';

export default GlobalStyles;
