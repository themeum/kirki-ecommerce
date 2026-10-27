import { describe, expect, it } from 'vitest';

import { getCssVarName, PRIMITIVE_CSS_VAR_KEYS, type PrimitiveColorKey, theme } from '@/theme';

const primitives = theme.primitives.colors as Record<string, string>;
const cssVarKeys = PRIMITIVE_CSS_VAR_KEYS as Record<string, string>;

const ANALYTICS_PRIMITIVES: [string, string, string][] = [
  ['analyticsPurple50', '#EFE8FF', '--kirki-ecommerce-color-analytics-purple-50'],
  ['analyticsPurple100', '#E6DCFF', '--kirki-ecommerce-color-analytics-purple-100'],
  ['analyticsPurple200', '#CBB8FF', '--kirki-ecommerce-color-analytics-purple-200'],
  ['analyticsPurple300', '#B49AFF', '--kirki-ecommerce-color-analytics-purple-300'],
  ['analyticsPurple400', '#A98BFF', '--kirki-ecommerce-color-analytics-purple-400'],
  ['analyticsPurple700', '#4A0FD1', '--kirki-ecommerce-color-analytics-purple-700'],
  ['analyticsPurple900', '#2A0A7A', '--kirki-ecommerce-color-analytics-purple-900'],
  ['analyticsTeal', '#0F9D8A', '--kirki-ecommerce-color-analytics-teal'],
  ['analyticsSlate', '#8A8F98', '--kirki-ecommerce-color-analytics-slate'],
  ['analyticsAmber', '#C27C0E', '--kirki-ecommerce-color-analytics-amber'],
  ['analyticsRed', '#D63A3A', '--kirki-ecommerce-color-analytics-red'],
  ['analyticsGray', '#9A9AA3', '--kirki-ecommerce-color-analytics-gray'],
  ['analyticsMapEmpty', '#E9E9EE', '--kirki-ecommerce-color-analytics-map-empty'],
  ['analyticsGaugeTrack', '#EFEFEF', '--kirki-ecommerce-color-analytics-gauge-track'],
  ['analyticsTooltip', '#1A1A1A', '--kirki-ecommerce-color-analytics-tooltip'],
  ['analyticsPace1', '#E8590C', '--kirki-ecommerce-color-analytics-pace-1'],
  ['analyticsPace2', '#C9790A', '--kirki-ecommerce-color-analytics-pace-2'],
  ['analyticsPace3', '#A08A0C', '--kirki-ecommerce-color-analytics-pace-3'],
  ['analyticsPace4', '#76911A', '--kirki-ecommerce-color-analytics-pace-4'],
  ['analyticsPace5', '#5A9E2A', '--kirki-ecommerce-color-analytics-pace-5'],
  ['analyticsPace6', '#2F8A3A', '--kirki-ecommerce-color-analytics-pace-6'],
  ['analyticsReachedGlow', '#3FAE5A', '--kirki-ecommerce-color-analytics-reached-glow'],
  ['analyticsSuccessSoft', '#1C732A17', '--kirki-ecommerce-color-analytics-success-soft'],
  ['analyticsWarningSoft', '#FFF1D6', '--kirki-ecommerce-color-analytics-warning-soft'],
  ['analyticsWarningSubtle', '#FFF7E6', '--kirki-ecommerce-color-analytics-warning-subtle'],
];

const TOKENS: [string, string][] = [
  ['chart.primary', 'violet2'],
  ['chart.previous', 'analyticsPurple200'],
  ['chart.comparisonLine', 'gray8'],
  ['chart.soft', 'analyticsPurple100'],
  ['chart.mid', 'analyticsPurple300'],
  ['chart.grid', 'gray3'],
  ['chart.gridBase', 'gray5'],
  ['chart.crosshair', 'gray7'],
  ['chart.empty', 'gray5'],
  ['chart.tooltip', 'analyticsTooltip'],
  ['series.primary', 'violet2'],
  ['series.secondary', 'analyticsTeal'],
  ['series.tertiary', 'analyticsAmber'],
  ['series.other', 'analyticsSlate'],
  ['breakdown.bar', 'violet2'],
  ['breakdown.emphasis', 'violet2'],
  ['breakdown.discounts', 'analyticsAmber'],
  ['fulfillment.unfulfilled', 'analyticsSlate'],
  ['fulfillment.onHold', 'analyticsAmber'],
  ['fulfillment.processing', 'brand1'],
  ['fulfillment.shipped', 'violet2'],
  ['fulfillment.delivered', 'analyticsTeal'],
  ['fulfillment.returned', 'analyticsPurple900'],
  ['fulfillment.cancelled', 'analyticsRed'],
  ['map.low', 'analyticsPurple100'],
  ['map.high', 'analyticsPurple700'],
  ['map.empty', 'analyticsMapEmpty'],
  ['map.outline', 'analyticsPurple900'],
  ['map.ping', 'violet2'],
  ['heatmap.increase', 'violet2'],
  ['heatmap.decrease', 'analyticsGray'],
  ['goal.track', 'analyticsGaugeTrack'],
  ['goal.pace1', 'analyticsPace1'],
  ['goal.pace2', 'analyticsPace2'],
  ['goal.pace3', 'analyticsPace3'],
  ['goal.pace4', 'analyticsPace4'],
  ['goal.pace5', 'analyticsPace5'],
  ['goal.pace6', 'analyticsPace6'],
  ['goal.reached', 'green6'],
  ['goal.reachedGlow', 'analyticsReachedGlow'],
  ['goal.missed', 'analyticsGray'],
  ['status.goodBackground', 'analyticsSuccessSoft'],
  ['status.goodText', 'green6'],
  ['status.neutralBackground', 'analyticsPurple50'],
  ['status.neutralText', 'analyticsPurple700'],
  ['status.warningBackground', 'analyticsWarningSoft'],
  ['status.warningSubtleBackground', 'analyticsWarningSubtle'],
  ['status.warningText', 'orange2'],
  ['status.criticalBackground', 'red1'],
  ['status.criticalText', 'red3'],
];

/** Design colors that equal an existing primitive and so must NOT be added again. */
const REUSED_DESIGN_COLORS = ['#5A12FF', '#167BFF', '#1C732A', '#854807', '#D40000', '#EBEBEB'];

/** Reduce any color string the theme uses (hex, 8-digit hex, rgba) to "r,g,b,a". */
const normalizeColor = (value: string): string => {
  const text = value.trim();
  const hex = /^#([0-9a-f]{6})([0-9a-f]{2})?$/i.exec(text);

  if (hex) {
    const channels = [0, 2, 4].map((offset) => parseInt(hex[1].slice(offset, offset + 2), 16));
    const alpha = hex[2] ? Math.round((parseInt(hex[2], 16) / 255) * 100) / 100 : 1;

    return [...channels, alpha].join(',');
  }

  const rgba = /^rgba?\(([^)]+)\)$/i.exec(text);

  if (rgba) {
    const parts = rgba[1].split(',').map((part) => Number(part.trim()));

    return [parts[0], parts[1], parts[2], parts[3] ?? 1].join(',');
  }

  return text.toLowerCase();
};

const getPath = (source: unknown, path: string): unknown => {
  return path
    .split('.')
    .reduce<unknown>((value, key) => (value as Record<string, unknown> | undefined)?.[key], source);
};

describe('analytics color primitives', () => {
  // Scenario: Primitive values
  it.each(ANALYTICS_PRIMITIVES)('%s has the hex value %s', (key, hex) => {
    expect(primitives[key]?.toLowerCase()).toBe(hex.toLowerCase());
  });

  // Scenario: Primitive values (CSS custom property)
  it.each(ANALYTICS_PRIMITIVES)('%s has the CSS custom property %s*', (key, _hex, cssVar) => {
    expect(cssVarKeys[key]).toBeDefined();
    expect(getCssVarName(key as PrimitiveColorKey)).toBe(cssVar);
  });

  it('adds exactly the 25 analytics primitives', () => {
    const analyticsKeys = Object.keys(primitives).filter((key) => key.startsWith('analytics'));

    expect(analyticsKeys.sort()).toEqual(ANALYTICS_PRIMITIVES.map(([key]) => key).sort());
    expect(analyticsKeys).toHaveLength(25);
  });

  // Scenario: No duplicate of an existing primitive
  it('does not repeat the value of an existing primitive', () => {
    const existing = Object.entries(primitives).filter(([key]) => !key.startsWith('analytics'));
    const existingValues = new Map(existing.map(([key, value]) => [normalizeColor(value), key]));

    for (const [key] of ANALYTICS_PRIMITIVES) {
      expect(primitives[key], `${key} is not defined`).toBeDefined();

      const duplicate = existingValues.get(normalizeColor(primitives[key] ?? ''));

      expect(duplicate, `${key} repeats ${duplicate}`).toBeUndefined();
    }
  });

  it('does not add again a design color that already exists as a primitive', () => {
    const analyticsValues = Object.entries(primitives)
      .filter(([key]) => key.startsWith('analytics'))
      .map(([, value]) => normalizeColor(value));

    expect(analyticsValues).toHaveLength(25);
    for (const color of REUSED_DESIGN_COLORS) {
      expect(analyticsValues).not.toContain(normalizeColor(color));
    }
  });

  it('does not repeat a value inside the analytics primitives', () => {
    const values = ANALYTICS_PRIMITIVES.map(([key]) => normalizeColor(primitives[key] ?? ''));

    expect(new Set(values).size).toBe(values.length);
  });
});

describe('theme.colors.analytics', () => {
  it.each(TOKENS)('%s resolves through the %s primitive', (path, primitive) => {
    const expected = `var(${getCssVarName(primitive as PrimitiveColorKey)})`;

    expect(getPath(theme.colors.analytics, path)).toBe(expected);
  });

  // Scenario: Token resolves to a primitive
  it('resolves fulfillment.delivered to #0F9D8A through the teal variable', () => {
    const token = getPath(theme.colors.analytics, 'fulfillment.delivered');

    expect(token).toBe('var(--kirki-ecommerce-color-analytics-teal)');
    expect(primitives.analyticsTeal.toUpperCase()).toBe('#0F9D8A');
  });
});
