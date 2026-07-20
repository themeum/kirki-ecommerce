import { Global, css, useTheme } from '@emotion/react';

import { get_css_var_name, type PrimitiveColorKey } from '@/theme';
import { get_normalize_styles } from '@/theme/normalize';

/**
 * Injects primitive CSS variables and the app normalize reset via Emotion Global.
 *
 * @returns Global style element for theme variables and normalize rules.
 */
const GlobalStyles = () => {
  const theme = useTheme();
  const primitive_entries = Object.entries(theme.primitives.colors) as Array<
    [PrimitiveColorKey, string]
  >;

  const css_variables: Record<string, string> = {};

  for (const [key, value] of primitive_entries) {
    css_variables[get_css_var_name(key)] = value;
  }

  return (
    <Global
      styles={css({
        ':root': css_variables,
        ...get_normalize_styles(theme),
      })}
    />
  );
};

GlobalStyles.displayName = 'GlobalStyles';

export default GlobalStyles;
