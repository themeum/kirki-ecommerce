import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import InputGroupField from '@/components/form/input-group-field';
import { FormHarness, ValueProbe } from '@/tests/form-field-harness';

const setup = (initial: unknown) => {
  render(
    <FormHarness defaultValues={{ rate: initial }}>
      <InputGroupField name="rate" type="number" min={0} max={100} placeholder="0" />
      <ValueProbe name="rate" />
    </FormHarness>,
  );

  return screen.getByRole('spinbutton');
};

afterEach(cleanup);

describe('InputGroupField', () => {
  it('clears a number field seeded with a non-zero default', () => {
    const input = setup(5);

    fireEvent.change(input, { target: { value: '' } });

    expect((input as HTMLInputElement).value).toBe('');
    expect(screen.getByTestId('probe-rate').textContent).toBe('null');
  });

  it('clears a number field seeded with zero', () => {
    const input = setup(0);

    fireEvent.change(input, { target: { value: '' } });

    expect((input as HTMLInputElement).value).toBe('');
  });

  it('writes a clamped number and keeps it displayed', () => {
    const input = setup(null);

    fireEvent.change(input, { target: { value: '150' } });

    expect(screen.getByTestId('probe-rate').textContent).toBe('100');
  });
});
