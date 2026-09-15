import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import { RegionsDialog } from '@/components/regions-dialog';
import type { Country } from '@/schemas/reference/country';
import type { RegionsDialogFormPayload } from '@/schemas/shared/region';

afterEach(cleanup);

beforeAll(() => {
  // jsdom has no layout engine, so @tanstack/react-virtual's element-size
  // reads (offsetWidth/offsetHeight) are always 0 and it renders zero rows.
  // Stub the dialog's scroll-area size so the virtualizer behaves as it would
  // in a real browser.
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 432 });
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { configurable: true, value: 480 });
});

const countries: Country[] = [
  {
    name: 'United States',
    code: 'US',
    flag: '🇺🇸',
    states: [
      { id: 1, name: 'Alabama' },
      { id: 2, name: 'California' },
      { id: 3, name: 'Texas' },
    ],
  },
  {
    name: 'Canada',
    code: 'CA',
    flag: '🇨🇦',
    states: [
      { id: 10, name: 'Ontario' },
      { id: 11, name: 'Quebec' },
    ],
  },
  {
    name: 'Nepal',
    code: 'NP',
    flag: '🇳🇵',
    states: [],
  },
];

const renderDialog = (props: Partial<Parameters<typeof RegionsDialog>[0]> = {}) => {
  const onDone = vi.fn<(values: RegionsDialogFormPayload) => void>();

  render(
    <RegionsDialog
      open
      onOpenChange={vi.fn()}
      countries={countries}
      onDone={onDone}
      {...props}
    />,
  );

  return { onDone };
};

const countryCheckbox = (code: string) =>
  document.getElementById(`regions-dialog-country-${code}`) as HTMLButtonElement;

const stateCheckbox = (code: string, stateId: number) =>
  document.getElementById(`regions-dialog-state-${code}-${stateId}`) as HTMLButtonElement | null;

const countryRow = (code: string) => countryCheckbox(code).parentElement!.parentElement!;

const doneButton = () => screen.getByRole('button', { name: 'Done' });

const submit = () => fireEvent.click(doneButton());

describe('RegionsDialog', () => {
  it('selects every state of a country when its checkbox is ticked', async () => {
    const { onDone } = renderDialog();

    fireEvent.click(countryCheckbox('US'));
    submit();

    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDone.mock.calls[0][0]).toEqual({
      title: null,
      countries: ['US'],
      regions: [{ country: 'US', states: [1, 2, 3], hasDeselectedState: false, flag: '🇺🇸' }],
    });
  });

  it('expands a country on select so its states are visible', () => {
    renderDialog();

    expect(stateCheckbox('US', 1)).toBeNull();

    fireEvent.click(countryCheckbox('US'));

    expect(stateCheckbox('US', 1)).not.toBeNull();
    expect(stateCheckbox('US', 1)).toHaveAttribute('data-state', 'checked');
  });

  it('deselects a fully selected country, disabling the done button', () => {
    renderDialog();

    fireEvent.click(countryCheckbox('US'));
    expect(doneButton()).toBeEnabled();

    fireEvent.click(countryCheckbox('US'));
    expect(doneButton()).toBeDisabled();
  });

  it('marks a country partially selected when one of its states is unticked', async () => {
    const { onDone } = renderDialog();

    fireEvent.click(countryCheckbox('US'));
    fireEvent.click(stateCheckbox('US', 2)!);
    submit();

    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDone.mock.calls[0][0].regions).toEqual([
      { country: 'US', states: [1, 3], hasDeselectedState: true, flag: '🇺🇸' },
    ]);
    expect(countryCheckbox('US')).toHaveAttribute('data-state', 'indeterminate');
  });

  it('selects the country when a single state is ticked from a collapsed row', async () => {
    const { onDone } = renderDialog();

    fireEvent.click(countryRow('CA'));
    fireEvent.click(stateCheckbox('CA', 11)!);
    submit();

    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDone.mock.calls[0][0]).toEqual({
      title: null,
      countries: ['CA'],
      regions: [{ country: 'CA', states: [11], hasDeselectedState: true, flag: '🇨🇦' }],
    });
  });

  it('toggles expansion without selecting when the country row is clicked', () => {
    renderDialog();

    fireEvent.click(countryRow('US'));

    expect(stateCheckbox('US', 1)).not.toBeNull();
    expect(countryCheckbox('US')).toHaveAttribute('data-state', 'unchecked');

    fireEvent.click(countryRow('US'));

    expect(stateCheckbox('US', 1)).toBeNull();
  });

  it('selects a country without states directly from its row', async () => {
    const { onDone } = renderDialog();

    fireEvent.click(countryRow('NP'));
    submit();

    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDone.mock.calls[0][0].regions).toEqual([
      { country: 'NP', states: [], hasDeselectedState: false, flag: '🇳🇵' },
    ]);
  });

  it('filters by country name', async () => {
    renderDialog();

    fireEvent.change(screen.getByPlaceholderText('Search country or state'), {
      target: { value: 'canada' },
    });

    await vi.waitFor(() => expect(countryCheckbox('US')).toBeNull());
    expect(countryCheckbox('CA')).not.toBeNull();
  });

  it('filters by state name, narrowing the country to the matched states', async () => {
    renderDialog();

    fireEvent.change(screen.getByPlaceholderText('Search country or state'), {
      target: { value: 'quebec' },
    });

    await vi.waitFor(() => expect(countryCheckbox('US')).toBeNull());

    fireEvent.click(countryRow('CA'));

    expect(stateCheckbox('CA', 11)).not.toBeNull();
    expect(stateCheckbox('CA', 10)).toBeNull();
  });

  it('shows the empty state when nothing matches', async () => {
    renderDialog();

    fireEvent.change(screen.getByPlaceholderText('Search country or state'), {
      target: { value: 'atlantis' },
    });

    expect(await screen.findByText('No country or state available')).toBeInTheDocument();
  });

  it('disables a country whose states are all already in use', () => {
    renderDialog({ disabledRegions: [{ country: 'CA', states: [10, 11] }] });

    expect(countryCheckbox('CA')).toBeDisabled();
    expect(countryCheckbox('US')).toBeEnabled();
    expect(countryRow('CA').closest('[data-tooltip="true"]')).not.toBeNull();
  });

  it('expands a partially used country and disables only the used states', () => {
    renderDialog({ disabledRegions: [{ country: 'CA', states: [10] }] });

    expect(countryCheckbox('CA')).toBeEnabled();
    expect(stateCheckbox('CA', 10)).toBeDisabled();
    expect(stateCheckbox('CA', 10)).toHaveAttribute('data-state', 'checked');
    expect(stateCheckbox('CA', 11)).toBeEnabled();
  });

  it('omits a used state from the selection when the country is ticked', async () => {
    const { onDone } = renderDialog({ disabledRegions: [{ country: 'CA', states: [10] }] });

    fireEvent.click(countryCheckbox('CA'));
    submit();

    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDone.mock.calls[0][0].regions).toEqual([
      { country: 'CA', states: [11], hasDeselectedState: false, flag: '🇨🇦' },
    ]);
  });

  it('selects countries without states and hides state rows in countryOnly mode', async () => {
    const { onDone } = renderDialog({ countryOnly: true });

    fireEvent.click(countryRow('US'));

    expect(stateCheckbox('US', 1)).toBeNull();

    submit();

    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDone.mock.calls[0][0].regions).toEqual([
      { country: 'US', states: [], hasDeselectedState: false, flag: '🇺🇸' },
    ]);
  });

  it('disables an already used country outright in countryOnly mode', () => {
    renderDialog({ countryOnly: true, disabledRegions: [{ country: 'US', states: [] }] });

    expect(countryCheckbox('US')).toBeDisabled();
  });

  it('requires a title before the done button is enabled when adding', async () => {
    const { onDone } = renderDialog({ from: 'add' });

    fireEvent.click(countryCheckbox('NP'));
    expect(doneButton()).toBeDisabled();

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Zone 2' } });

    await vi.waitFor(() => expect(doneButton()).toBeEnabled());

    submit();

    await vi.waitFor(() => expect(onDone).toHaveBeenCalledTimes(1));
    expect(onDone.mock.calls[0][0].title).toBe('Zone 2');
  });

  it('hydrates from defaultValue when opened', () => {
    renderDialog({
      from: 'add',
      defaultValue: {
        title: 'South Asia',
        countryCodes: ['CA'],
        regions: [{ country: 'CA', states: [10], hasDeselectedState: true, flag: '🇨🇦' }],
      },
    });

    expect(screen.getByLabelText('Title')).toHaveValue('South Asia');
    expect(countryCheckbox('CA')).toHaveAttribute('data-state', 'indeterminate');
    expect(stateCheckbox('CA', 10)).toHaveAttribute('data-state', 'checked');
    expect(stateCheckbox('CA', 11)).toHaveAttribute('data-state', 'unchecked');
  });

  it('renders only a window of rows for a large country list', () => {
    const manyCountries: Country[] = Array.from({ length: 300 }, (_, index) => ({
      name: `Country ${index}`,
      code: `C${index}`,
      flag: '',
      states: [],
    }));

    render(
      <RegionsDialog open onOpenChange={vi.fn()} countries={manyCountries} onDone={vi.fn()} />,
    );

    const renderedRows = document.querySelectorAll('[data-index]');

    expect(renderedRows.length).toBeGreaterThan(0);
    expect(renderedRows.length).toBeLessThan(40);
    expect(countryCheckbox('C0')).not.toBeNull();
    expect(countryCheckbox('C299')).toBeNull();
  });

  it('surfaces a regions error passed from the parent', async () => {
    renderDialog({ errors: { regions: 'Select at least one region' } });

    await vi.waitFor(() =>
      expect(screen.getByPlaceholderText('Search country or state')).toHaveAttribute(
        'data-error',
        'true',
      ),
    );
  });
});
