import { describe, expect, it } from 'vitest';

import type { SetupRowState } from '@/features/onboarding/hooks/use-staggered-rows';
import { getCompletionProgress, getStepProgress } from '@/features/onboarding/lib/progress';

const rows = (completed: number, total: number): SetupRowState[] =>
  Array.from({ length: total }, (_, index) => (index < completed ? 'completed' : 'waiting'));

describe('getStepProgress', () => {
  it('divides the bar into the input steps plus the completion screen', () => {
    expect(getStepProgress(0, 4)).toBe(0);
    expect(getStepProgress(1, 4)).toBe(20);
    expect(getStepProgress(3, 4)).toBe(60);
    expect(getStepProgress(1, 3)).toBe(25);
    expect(getStepProgress(2, 3)).toBe(50);
  });
});

describe('getCompletionProgress', () => {
  it('starts at the last part of the bar', () => {
    expect(
      getCompletionProgress({
        stepCount: 4,
        rowStates: rows(0, 5),
        hasMigration: true,
        migrationPercent: 0,
      }),
    ).toBe(80);
  });

  it('fills 10% of the last part with the setup rows when WooCommerce is present', () => {
    expect(
      getCompletionProgress({
        stepCount: 4,
        rowStates: rows(2, 5),
        hasMigration: true,
        migrationPercent: 0,
      }),
    ).toBeCloseTo(80.8, 5);
    expect(
      getCompletionProgress({
        stepCount: 4,
        rowStates: rows(5, 5),
        hasMigration: true,
        migrationPercent: 0,
      }),
    ).toBeCloseTo(82, 5);
  });

  it('fills the other 90% with the migration percent and does not reset', () => {
    expect(
      getCompletionProgress({
        stepCount: 4,
        rowStates: rows(5, 5),
        hasMigration: true,
        migrationPercent: 50,
      }),
    ).toBeCloseTo(91, 5);
    expect(
      getCompletionProgress({
        stepCount: 4,
        rowStates: rows(5, 5),
        hasMigration: true,
        migrationPercent: 100,
      }),
    ).toBe(100);
  });

  it('fills the whole last part with the setup rows when there is no migration', () => {
    expect(
      getCompletionProgress({
        stepCount: 3,
        rowStates: rows(2, 4),
        hasMigration: false,
        migrationPercent: 0,
      }),
    ).toBe(87.5);
    expect(
      getCompletionProgress({
        stepCount: 3,
        rowStates: rows(4, 4),
        hasMigration: false,
        migrationPercent: 0,
      }),
    ).toBe(100);
  });

  it('stays at the start of the last part before any row is known', () => {
    expect(
      getCompletionProgress({
        stepCount: 3,
        rowStates: [],
        hasMigration: false,
        migrationPercent: 0,
      }),
    ).toBe(75);
  });
});
