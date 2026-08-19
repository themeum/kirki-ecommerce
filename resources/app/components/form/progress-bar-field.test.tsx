import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import ProgressBarField from '@/components/form/progress-bar-field';
import { ErrorButton, FormHarness, ValueProbe } from '@/tests/form-field-harness';

const renderField = (height: unknown = 40) => {
  render(
    <FormHarness defaultValues={{ height }}>
      <ProgressBarField name="height" label="Height" rightText="40px" />
      <ValueProbe name="height" />
      <ErrorButton name="height" message="Height is required" />
    </FormHarness>,
  );

  return screen.getByRole('slider');
};

afterEach(cleanup);

describe('ProgressBarField', () => {
  it('renders the label, right text and current value', () => {
    const slider = renderField(40);

    expect(screen.getByText('Height')).toBeInTheDocument();
    expect(screen.getByText('40px')).toBeInTheDocument();
    expect(slider).toHaveAttribute('aria-valuenow', '40');
  });

  it('coerces a non-numeric value to zero', () => {
    const slider = renderField(null);

    expect(slider).toHaveAttribute('aria-valuenow', '0');
  });

  it('writes a number to form state when the track is clicked', () => {
    const slider = renderField(0);

    slider.getBoundingClientRect = () => ({ left: 0, width: 200 }) as DOMRect;

    fireEvent.mouseDown(slider, { clientX: 50 });

    expect(screen.getByTestId('probe-height').textContent).toBe('25');
  });

  it('renders the error', () => {
    renderField();

    fireEvent.click(screen.getByRole('button', { name: 'inject-height' }));

    expect(screen.getByText('Height is required')).toBeInTheDocument();
  });
});
