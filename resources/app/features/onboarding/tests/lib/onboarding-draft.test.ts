import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  clearDraft,
  DRAFT_STORAGE_KEY,
  readDraft,
  writeDraft,
} from '@/features/onboarding/lib/onboarding-draft';

const createMemoryStorage = (): Storage => {
  const items = new Map<string, string>();

  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => {
      items.delete(key);
    },
    setItem: (key, value) => {
      items.set(key, value);
    },
  };
};

describe('onboarding draft', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips the step and values', () => {
    vi.stubGlobal('sessionStorage', createMemoryStorage());

    writeDraft({ step: 2, values: { store_name: 'Acme', country: 'BD' } });

    expect(readDraft()).toEqual({ step: 2, values: { store_name: 'Acme', country: 'BD' } });
  });

  it('keeps a draft on the Store Tax step', () => {
    vi.stubGlobal('sessionStorage', createMemoryStorage());

    writeDraft({ step: 3, values: { is_tax_collected: true, store_tax_id: 'VAT-1' } });

    expect(readDraft()).toEqual({
      step: 3,
      values: { is_tax_collected: true, store_tax_id: 'VAT-1' },
    });
  });

  it('returns null after the draft is cleared', () => {
    vi.stubGlobal('sessionStorage', createMemoryStorage());

    writeDraft({ step: 1, values: { store_name: 'Acme' } });
    clearDraft();

    expect(readDraft()).toBeNull();
  });

  it('ignores a malformed draft', () => {
    const storage = createMemoryStorage();
    storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ step: 7, values: {} }));
    vi.stubGlobal('sessionStorage', storage);

    expect(readDraft()).toBeNull();
  });

  it('keeps working when storage throws', () => {
    const throwing = createMemoryStorage();
    throwing.getItem = () => {
      throw new Error('blocked');
    };
    throwing.setItem = () => {
      throw new Error('blocked');
    };
    throwing.removeItem = () => {
      throw new Error('blocked');
    };
    vi.stubGlobal('sessionStorage', throwing);

    expect(() => writeDraft({ step: 0, values: {} })).not.toThrow();
    expect(() => clearDraft()).not.toThrow();
    expect(readDraft()).toBeNull();
  });
});
