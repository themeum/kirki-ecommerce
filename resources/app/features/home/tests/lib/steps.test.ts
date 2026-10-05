import { Plus, Shirt } from 'lucide-react';
import { describe, expect, it } from 'vitest';

import {
  getChecklistProgress,
  getFirstIncompleteStepId,
  getSetupStepDefinition,
} from '@/features/home/lib/steps';
import type { SetupStep, SetupStepId } from '@/features/home/schemas/catalog/setup-checklist';

const step = (id: SetupStepId, overrides: Partial<SetupStep> = {}): SetupStep => ({
  id,
  is_completed: false,
  is_preconfigured: false,
  has_data: false,
  ...overrides,
});

describe('getChecklistProgress', () => {
  it('counts completed visible steps and rounds the percentage', () => {
    const steps = [
      step('products', { is_completed: true }),
      step('payments', { is_completed: true }),
      step('tax'),
      step('shipping'),
    ];

    expect(getChecklistProgress(steps)).toEqual({ completed: 2, total: 4, percent: 50 });
  });

  it('rounds to the nearest whole percent', () => {
    const steps = [step('products', { is_completed: true }), step('payments'), step('tax')];

    expect(getChecklistProgress(steps).percent).toBe(33);
  });

  it('reports zero for an empty checklist', () => {
    expect(getChecklistProgress([])).toEqual({ completed: 0, total: 0, percent: 0 });
  });
});

describe('getFirstIncompleteStepId', () => {
  it('returns the first step that is not completed', () => {
    expect(
      getFirstIncompleteStepId([
        step('products', { is_completed: true }),
        step('payments'),
        step('shipping'),
      ]),
    ).toBe('payments');
  });

  it('returns an empty value when every step is completed', () => {
    expect(getFirstIncompleteStepId([step('products', { is_completed: true })])).toBe('');
  });
});

describe('getSetupStepDefinition', () => {
  it('offers "Add" without data and does not complete the step', () => {
    const [action] = getSetupStepDefinition(step('tax')).actions;

    expect(action).toMatchObject({
      kind: 'link',
      label: 'Add tax rate',
      icon: Plus,
      to: '/settings/tax',
    });
    expect(action).not.toHaveProperty('completesStep');
  });

  it('offers "Update" for a preconfigured step and completes it on click', () => {
    const [action] = getSetupStepDefinition(
      step('shipping', { has_data: true, is_preconfigured: true }),
    ).actions;

    expect(action).toMatchObject({ label: 'Update shipping rate', completesStep: true });
  });

  it('does not complete an already completed preconfigured step again', () => {
    const [action] = getSetupStepDefinition(
      step('shipping', { has_data: true, is_preconfigured: true, is_completed: true }),
    ).actions;

    expect(action).toMatchObject({ completesStep: false });
  });

  it('routes both payment buttons to Payment settings', () => {
    const actions = getSetupStepDefinition(step('payments')).actions;

    expect(actions.map((action) => [action.label, action.kind === 'link' && action.to])).toEqual([
      ['Add payment', '/settings/payments'],
      ['Cash on delivery', '/settings/payments'],
    ]);
  });

  it('links "Add products" to the create product page', () => {
    expect(getSetupStepDefinition(step('products')).actions[0]).toMatchObject({
      kind: 'link',
      to: '/products/create',
    });
  });

  it('offers "Load sample data" while the store has no products', () => {
    expect(getSetupStepDefinition(step('products')).actions[1]).toEqual({
      kind: 'sample-data',
      label: 'Load sample data',
      variant: 'outline',
      icon: Shirt,
    });
  });

  it('hides "Load sample data" once products exist', () => {
    const actions = getSetupStepDefinition(step('products', { has_data: true })).actions;

    expect(actions.map((action) => action.label)).toEqual(['Add products']);
  });
});
