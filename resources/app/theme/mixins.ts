import { css, type CSSObject, type Theme } from '@emotion/react';

const APP_ROOT_SELECTOR = '#wpbody-content .kirki-ecommerce-root';

type CssOverrideProp = {
  cssOverride?: CSSObject;
};

type StyleTree = CSSObject | { readonly [key: string]: StyleTree };

type MergeCssInput = CSSObject | false | null | undefined | '';

/**
 * Type-check a style map (or single CSSObject) once, instead of
 * repeating `satisfies CSSObject` on every leaf.
 *
 * @param styles Style tree to validate.
 *
 * @returns The same styles, with literal key types preserved.
 */
const defineStyles = <T extends StyleTree>(styles: T): T => styles;

const isSerializedStyles = (value: unknown): boolean => {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  const record = value as Record<string, unknown>;

  return typeof record.name === 'string' && typeof record.styles === 'string';
};

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !isSerializedStyles(value)
  );
};

/**
 * Deep-merge two CSSObjects. Nested selector blocks merge property-by-property;
 * leaf values from `override` win on conflicts.
 *
 * @param base Base CSS object.
 * @param override Override CSS object.
 *
 * @returns Merged CSS object.
 */
const deepMergeCss = (base: CSSObject, override: CSSObject): CSSObject => {
  const result: CSSObject = { ...base };

  for (const key of Object.keys(override)) {
    const baseValue = base[key as keyof CSSObject];
    const overrideValue = override[key as keyof CSSObject];

    if (isPlainObject(baseValue) && isPlainObject(overrideValue)) {
      result[key as keyof CSSObject] = deepMergeCss(
        baseValue as CSSObject,
        overrideValue as CSSObject,
      ) as CSSObject[keyof CSSObject];
      continue;
    }

    result[key as keyof CSSObject] = overrideValue as CSSObject[keyof CSSObject];
  }

  return result;
};

/**
 * Deep-merge CSSObjects; later args win on conflicts. Falsy entries are skipped.
 *
 * @param objects CSS objects to merge.
 *
 * @returns Merged CSS object.
 */
const mergeCss = (...objects: MergeCssInput[]): CSSObject => {
  return objects
    .filter((object): object is CSSObject => {
      return Boolean(object) && isPlainObject(object);
    })
    .reduce<CSSObject>((acc, object) => deepMergeCss(acc, object), {});
};

/**
 * Scope Emotion styles under the app root so they beat the normalize button/input resets.
 * Uses `&&` to raise specificity above typed form-control selectors (e.g. input[type="text"]).
 *
 * @param stylesOrLabel CSS object, or a debug label when a second styles argument is provided.
 * @param maybeStyles CSS object when the first argument is a debug label.
 *
 * @returns Emotion css styles nested under the app root selector.
 */
const scoped = (stylesOrLabel: CSSObject | string, maybeStyles?: CSSObject) => {
  const label = typeof stylesOrLabel === 'string' ? stylesOrLabel : undefined;
  const styles = typeof stylesOrLabel === 'string' ? (maybeStyles ?? {}) : stylesOrLabel;

  return css({
    label: import.meta.env.DEV && label ? label : undefined,
    [`${APP_ROOT_SELECTOR} &&`]: styles,
  });
};

/**
 * Merge CSSObjects then wrap in a single scoped() call.
 *
 * @param objects CSS objects to merge before scoping.
 *
 * @returns Emotion css styles nested under the app root selector.
 */
const scopedMerge = (...objects: MergeCssInput[]) => {
  return scoped(mergeCss(...objects));
};

/**
 * Flexbox centering utility matching the SCSS flexCenter mixin.
 *
 * @returns CSS object for centered flex layout.
 */
const flexCenter = (): CSSObject => {
  return {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  };
};

/**
 * Horizontal item alignment utility matching the SCSS itemCenter mixin.
 *
 * @returns CSS object for flex row with vertically centered items.
 */
const itemCenter = (): CSSObject => {
  return {
    display: 'flex',
    alignItems: 'center',
  };
};

/**
 * Focus ring utility matching the SCSS ui-focus-ring mixin.
 *
 * @param theme Current Emotion theme.
 * @param ringColor Optional ring color override.
 *
 * @returns CSS object for the focus ring box-shadow.
 */
const uiFocusRing = (theme: Theme, ringColor?: string): CSSObject => {
  const color = ringColor ?? theme.colors.border.ring;

  return {
    outline: 'none',
    boxShadow: `0 0 0 2px ${theme.colors.background.fill}, 0 0 0 4px ${color}`,
  };
};

export {
  APP_ROOT_SELECTOR,
  defineStyles,
  flexCenter,
  itemCenter,
  mergeCss,
  scoped,
  scopedMerge,
  uiFocusRing
};

export type { CssOverrideProp, StyleTree };

