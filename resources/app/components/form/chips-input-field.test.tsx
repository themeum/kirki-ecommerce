import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import ChipsInputField from '@/components/form/chips-input-field';
import { ErrorButton, FormHarness, ValueProbe } from '@/tests/form-field-harness';

const renderField = (onCommit?: (next: string[]) => void, flags: string[] = []) => {
  render(
    <FormHarness defaultValues={{ flags }}>
      <ChipsInputField
        name="flags"
        label="Flag"
        placeholder="i.e Backorder"
        onCommit={onCommit}
      />
      <ValueProbe name="flags" />
      <ErrorButton name="flags" message="At least one flag is required" />
    </FormHarness>,
  );

  return screen.getByPlaceholderText('i.e Backorder');
};

const probe = () => screen.getByTestId('probe-flags').textContent;

const pressEnter = (input: HTMLElement, value: string) => {
  fireEvent.change(input, { target: { value } });
  fireEvent.keyDown(input, { key: 'Enter' });
};

afterEach(cleanup);

describe('ChipsInputField', () => {
  it('renders the label and existing chips', () => {
    renderField(undefined, ['urgent']);

    expect(screen.getByText('Flag')).toBeInTheDocument();
    expect(screen.getByText('urgent')).toBeInTheDocument();
  });

  it('appends the trimmed draft on Enter', () => {
    const input = renderField();

    pressEnter(input, '  backorder  ');

    expect(probe()).toBe('["backorder"]');
    expect(screen.getByText('backorder')).toBeInTheDocument();
    expect(input).toHaveValue('');
  });

  it('ignores blank and duplicate entries', () => {
    const onCommit = vi.fn();
    const input = renderField(onCommit, ['urgent']);

    pressEnter(input, '   ');
    pressEnter(input, 'urgent');

    expect(probe()).toBe('["urgent"]');
    expect(onCommit).not.toHaveBeenCalled();
  });

  it('reports both add and remove through onCommit', () => {
    const onCommit = vi.fn();
    const input = renderField(onCommit, ['urgent']);

    pressEnter(input, 'backorder');
    expect(onCommit).toHaveBeenLastCalledWith(['urgent', 'backorder']);

    fireEvent.click(screen.getAllByRole('button')[0]);

    expect(onCommit).toHaveBeenLastCalledWith(['backorder']);
    expect(probe()).toBe('["backorder"]');
  });

  it('renders the error and marks the control invalid', () => {
    const input = renderField();

    fireEvent.click(screen.getByRole('button', { name: 'inject-flags' }));

    expect(screen.getByText('At least one flag is required')).toBeInTheDocument();
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });
});
