import { type SpacingKey, theme } from '@/theme';
import type { GapValue } from '@/types/components/common';

/**
 * Resolve a gap value to a CSS length string.
 *
 * Spacing keys resolve to theme tokens; other strings pass through as-is.
 *
 * @param value Theme spacing key or custom CSS length.
 *
 * @returns CSS gap value.
 */
const resolveGap = (value: GapValue): string => {
  if (value in theme.spacing) {
    return theme.spacing[value as SpacingKey];
  }

  return String(value);
};

/**
 * Build a CSS grid-template-columns value from columns sugar or a template.
 *
 * When both are provided, template wins.
 *
 * @param columns Equal-column count sugar.
 * @param template Explicit track list as a string or string array.
 *
 * @returns CSS grid-template-columns value, or undefined when neither is set.
 */
const buildGridTemplate = (
  columns?: number,
  template?: string | string[],
): string | undefined => {
  if (template !== undefined) {
    if (Array.isArray(template)) {
      return template.join(' ');
    }

    return template;
  }

  if (columns !== undefined) {
    return `repeat(${columns}, 1fr)`;
  }

  return undefined;
};

/**
 * Build a CSS grid-template-areas value from a 2D area name matrix.
 *
 * @param areas Rows of area names.
 *
 * @returns CSS grid-template-areas value.
 */
const buildGridAreas = (areas: string[][]): string => {
  return areas.map((row) => `"${row.join(' ')}"`).join(' ');
};

export { buildGridAreas, buildGridTemplate, resolveGap };
