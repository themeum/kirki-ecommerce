import { describe, expect, it } from 'vitest';

import { selectAttributePresets } from '@/features/products/lib/attribute-presets';
import type { Attribute } from '@/features/products/schemas/catalog/attribute';

const attribute = (id: number, name: string): Attribute => ({ id, name });

const COLOR = attribute(1, 'Color');
const SIZE = attribute(2, 'Size');
const MATERIAL = attribute(3, 'Material');
const STYLE = attribute(4, 'Style');
const FIT = attribute(5, 'Fit');

const names = (attributes: Attribute[]) => attributes.map((item) => item.name);

describe('selectAttributePresets', () => {
  it('returns nothing when the store has no attributes', () => {
    expect(selectAttributePresets([], [])).toEqual({ presets: [], overflow: [] });
  });

  it('shows every attribute when there are fewer than three', () => {
    const { presets, overflow } = selectAttributePresets([SIZE, COLOR], []);

    expect(names(presets)).toEqual(['Color', 'Size']);
    expect(overflow).toEqual([]);
  });

  it('shows exactly three with no overflow', () => {
    const { presets, overflow } = selectAttributePresets([COLOR, SIZE, MATERIAL], []);

    expect(names(presets)).toEqual(['Color', 'Size', 'Material']);
    expect(overflow).toEqual([]);
  });

  it('puts everything past the first three by id into the overflow', () => {
    const { presets, overflow } = selectAttributePresets([FIT, STYLE, MATERIAL, SIZE, COLOR], []);

    expect(names(presets)).toEqual(['Color', 'Size', 'Material']);
    expect(names(overflow)).toEqual(['Style', 'Fit']);
  });

  it('backfills from the next ids when attributes are attached or open', () => {
    const { presets, overflow } = selectAttributePresets(
      [COLOR, SIZE, MATERIAL, STYLE, FIT],
      [COLOR.id, MATERIAL.id],
    );

    expect(names(presets)).toEqual(['Size', 'Style', 'Fit']);
    expect(overflow).toEqual([]);
  });
});
