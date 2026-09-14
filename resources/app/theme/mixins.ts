import { css, type CSSObject, type Theme } from '@emotion/react';
import React from 'react';

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
      result[key as keyof CSSObject] = deepMergeCss(baseValue, overrideValue);
      continue;
    }

    result[key as keyof CSSObject] = overrideValue;
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

type DebugFiberType = {
  displayName?: string;
  name?: string;
  render?: { displayName?: string; name?: string };
  type?: { displayName?: string; name?: string };
};

type DebugFiber = {
  type?: DebugFiberType | string | null;
  _debugOwner?: DebugFiber | null;
};

type ReactDevInternals = {
  __CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE?: {
    A?: { getOwner?: () => DebugFiber | null } | null;
  };
};

/**
 * Owner names that are safe to splice into a class name. Library wrappers use
 * namespaced displayNames (Radix's `Primitive.button.Slot`), and a dot inside a
 * class name silently turns the Emotion selector into an unmatchable compound
 * one — so anything that is not a plain identifier is skipped outright rather
 * than sanitized, since those wrapper names say nothing about where a component
 * is used anyway.
 */
const OWNER_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]*$/;

const toKebabCase = (name: string): string => {
  return name
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .replace(/_/g, '-')
    .toLowerCase();
};

const getFiberName = (fiber?: DebugFiber | null): string | undefined => {
  const type = fiber?.type;

  if (!type || typeof type === 'string') {
    return undefined;
  }

  return (
    type.displayName ??
    type.name ??
    type.render?.displayName ??
    type.render?.name ??
    type.type?.displayName ??
    type.type?.name
  );
};

/**
 * Prefix a debug label with the component that rendered the current one, so a
 * shared component's class name says where it is used — `<Card />` written in
 * product-form.tsx serializes as `css-xxx-product-form-card-L15`.
 *
 * `getOwner()` returns the fiber currently rendering; its `_debugOwner` is the
 * component whose JSX created that element. Returns the label unchanged outside
 * a render pass (module scope, event handlers), when the owner is not a plain
 * identifier, or when the label already carries the owner's name.
 *
 * Radix `asChild` clones its child, which re-points `_debugOwner` at the cloning
 * wrapper, so triggers fall back to the plain call-site label.
 *
 * Only ever called behind `import.meta.env.DEV`. React's internals are read
 * inline rather than cached so the whole branch drops out of production builds,
 * and every access is optional so a React upgrade that moves `A.getOwner`
 * degrades to an un-prefixed label instead of throwing.
 *
 * @param label Call-site label injected by the scoped-auto-label Babel plugin.
 *
 * @returns Label prefixed with the owning component name when one is available.
 */
const withOwnerLabel = (label: string): string => {
  const internals = (React as unknown as ReactDevInternals)
    .__CLIENT_INTERNALS_DO_NOT_USE_OR_WARN_USERS_THEY_CANNOT_UPGRADE;
  const owner = getFiberName(internals?.A?.getOwner?.()?._debugOwner);

  if (!owner || !OWNER_NAME_PATTERN.test(owner)) {
    return label;
  }

  const ownerLabel = toKebabCase(owner);

  if (label === ownerLabel || label.startsWith(`${ownerLabel}-`)) {
    return label;
  }

  return `${ownerLabel}-${label}`;
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
    label: import.meta.env.DEV && label ? withOwnerLabel(label) : undefined,
    [`${APP_ROOT_SELECTOR} &&`]: styles,
  });
};

/**
 * Merge CSSObjects then wrap in a single scoped() call.
 *
 * @param labelOrStyles CSS object, or a debug label when styles follow it.
 * @param objects CSS objects to merge before scoping.
 *
 * @returns Emotion css styles nested under the app root selector.
 */
const scopedMerge = (
  labelOrStyles?: string | CSSObject | false | null,
  ...objects: MergeCssInput[]
) => {
  if (typeof labelOrStyles === 'string') {
    return scoped(labelOrStyles, mergeCss(...objects));
  }

  return scoped(mergeCss(labelOrStyles, ...objects));
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
  const color = ringColor ?? theme.colors.background.fillSecondaryHover;

  return {
    outline: 'none',
    boxShadow: `0px 0px 0px 3px ${color}`,
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
  uiFocusRing,
};

export type { CssOverrideProp, StyleTree };
