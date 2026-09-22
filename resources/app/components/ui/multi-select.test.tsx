import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { type CSSProperties, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import MultiSelect, {
  type ChipCapProps,
  type MultiSelectOption,
} from '@/components/ui/multi-select';

const OPTIONS: MultiSelectOption[] = [
  { value: 1, title: 'Hoodie' },
  { value: 2, title: 'Sneakers' },
  { value: 3, title: 'Headwear' },
];

const PLACEHOLDER = 'Add tags';

/**
 * The selection is controlled, and half of what is under test is what happens
 * *after* a choice lands — so the tests drive a real state holder rather than
 * a spy that never feeds the new value back.
 */
const Harness = ({
  onCreate,
  initial = [],
  ...rest
}: {
  onCreate?: (query: string) => void | Promise<void>;
  initial?: MultiSelectOption[];
  createEmptyLabel?: string;
  selectedPlaceholder?: string;
  single?: boolean;
  optionStyle?: (option: MultiSelectOption) => CSSProperties | undefined;
} & ChipCapProps) => {
  const [value, setValue] = useState<MultiSelectOption[]>(initial);

  return (
    <MultiSelect
      options={OPTIONS}
      value={value}
      onChange={setValue}
      onCreate={onCreate}
      placeholder={PLACEHOLDER}
      {...rest}
    />
  );
};

// cmdk's input carries the combobox role; the box around it is presentational.
const searchInput = () => screen.getByRole('combobox');

const box = () => searchInput().parentElement!;

const open = () => fireEvent.click(box());

const type = (term: string) => fireEvent.change(searchInput(), { target: { value: term } });

const optionRow = (title: string) => screen.getByRole('option', { name: new RegExp(title) });

const removeButtons = () => screen.queryAllByRole('button', { name: 'Remove' });

const createRow = () => screen.queryByRole('button', { name: /Create|New/ });

afterEach(cleanup);

describe('MultiSelect box', () => {
  it('shows the input and no chips while nothing is selected', () => {
    render(<Harness />);

    expect(searchInput()).toHaveAttribute('placeholder', PLACEHOLDER);
    expect(removeButtons()).toHaveLength(0);
  });

  it('renders the selection as chips inside the box', () => {
    render(<Harness initial={[OPTIONS[0], OPTIONS[1]]} />);

    expect(box()).toHaveTextContent('Hoodie');
    expect(box()).toHaveTextContent('Sneakers');
    expect(removeButtons()).toHaveLength(2);
  });

  it('focuses the input when the box is clicked', () => {
    render(<Harness />);

    open();

    expect(searchInput()).toHaveFocus();
    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('swaps in the short placeholder once something is selected', () => {
    render(<Harness initial={[OPTIONS[0]]} selectedPlaceholder="Search" />);

    expect(searchInput()).toHaveAttribute('placeholder', 'Search');
  });

  it('removes a selection from its chip', () => {
    render(<Harness initial={[OPTIONS[0], OPTIONS[1]]} />);

    fireEvent.click(removeButtons()[0]);

    expect(removeButtons()).toHaveLength(1);
    expect(box()).not.toHaveTextContent('Hoodie');
  });
});

describe('MultiSelect selection', () => {
  it('reflects selection in each option row checkbox', () => {
    render(<Harness initial={[OPTIONS[0]]} />);

    open();

    expect(optionRow('Hoodie').querySelector('[data-state]')).toHaveAttribute(
      'data-state',
      'checked',
    );
    expect(optionRow('Sneakers').querySelector('[data-state]')).toHaveAttribute(
      'data-state',
      'unchecked',
    );
  });

  it('keeps the panel open and clears the search after a choice', () => {
    render(<Harness />);

    open();
    type('Hood');
    fireEvent.click(optionRow('Hoodie'));

    expect(searchInput()).toHaveValue('');
    expect(screen.getByRole('listbox')).toBeInTheDocument();
    expect(optionRow('Hoodie').querySelector('[data-state]')).toHaveAttribute(
      'data-state',
      'checked',
    );
  });

  it('deselects an option chosen a second time', () => {
    render(<Harness initial={[OPTIONS[0]]} />);

    open();
    fireEvent.click(optionRow('Hoodie'));

    expect(optionRow('Hoodie').querySelector('[data-state]')).toHaveAttribute(
      'data-state',
      'unchecked',
    );
  });
});

describe('MultiSelect chip capping', () => {
  it('shows every chip when no cap is set', () => {
    render(<Harness initial={OPTIONS} />);

    expect(removeButtons()).toHaveLength(3);
  });

  it('shows every chip when the selection is within the cap', () => {
    render(<Harness initial={[OPTIONS[0]]} maxVisibleChips={1} />);

    expect(removeButtons()).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /more/ })).not.toBeInTheDocument();
  });

  it('collapses past the cap behind a counter with no remove control', () => {
    render(<Harness initial={OPTIONS} maxVisibleChips={1} />);

    expect(removeButtons()).toHaveLength(1);

    const counter = screen.getByRole('button', { name: '+2 more' });

    expect(counter.querySelector('button')).toBeNull();
  });

  it('expands to the full set and collapses again', () => {
    render(<Harness initial={OPTIONS} maxVisibleChips={1} />);

    fireEvent.click(screen.getByRole('button', { name: '+2 more' }));

    expect(removeButtons()).toHaveLength(3);
    expect(screen.getByRole('button', { name: 'Show less' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Show less' }));

    expect(removeButtons()).toHaveLength(1);
    expect(screen.getByRole('button', { name: '+2 more' })).toBeInTheDocument();
  });

  it('stops counting once the selection falls back within the cap', () => {
    render(<Harness initial={OPTIONS} maxVisibleChips={1} />);

    fireEvent.click(screen.getByRole('button', { name: '+2 more' }));
    fireEvent.click(removeButtons()[0]);
    fireEvent.click(removeButtons()[0]);

    expect(removeButtons()).toHaveLength(1);
    expect(screen.queryByRole('button', { name: /more|Show less/ })).not.toBeInTheDocument();
  });
});

describe('MultiSelect create row', () => {
  it('reads the typed text back', () => {
    render(<Harness onCreate={vi.fn()} />);

    open();
    type('Shirt');

    expect(createRow()).toHaveTextContent('Create "Shirt"');
  });

  it('shows the empty message alongside the create row', () => {
    render(<Harness onCreate={vi.fn()} />);

    open();
    type('Shirt');

    expect(screen.getByText('No results found.')).toBeInTheDocument();
    expect(createRow()).toBeInTheDocument();
  });

  it('offers nothing to create on an empty input without a standing label', () => {
    render(<Harness onCreate={vi.fn()} />);

    open();

    expect(createRow()).not.toBeInTheDocument();
  });

  it('offers the standing label on an empty input when one is supplied', () => {
    render(<Harness onCreate={vi.fn()} createEmptyLabel="New tag" />);

    open();

    expect(createRow()).toHaveTextContent('New tag');
  });

  it('does not offer to create a value that already exists', () => {
    render(<Harness onCreate={vi.fn()} />);

    open();
    type('Hoodie');

    expect(createRow()).not.toBeInTheDocument();
  });

  it('hands the trimmed query to the handler', () => {
    const onCreate = vi.fn();

    render(<Harness onCreate={onCreate} />);

    open();
    type('  Shirt  ');
    fireEvent.click(createRow()!);

    expect(onCreate).toHaveBeenCalledWith('Shirt');
  });

  it('keeps the panel open and clears the search when the handler resolves', async () => {
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(<Harness onCreate={onCreate} />);

    open();
    type('Shirt');
    fireEvent.click(createRow()!);

    await vi.waitFor(() => expect(searchInput()).toHaveValue(''));

    expect(screen.getByRole('listbox')).toBeInTheDocument();
  });

  it('keeps the panel open with the typed text when the handler rejects', async () => {
    const onCreate = vi.fn().mockRejectedValue(new Error('taken'));

    render(<Harness onCreate={onCreate} />);

    open();
    type('Shirt');
    fireEvent.click(createRow()!);

    await vi.waitFor(() => expect(onCreate).toHaveBeenCalled());

    expect(searchInput()).toHaveValue('Shirt');
  });
});

describe('MultiSelect keyboard', () => {
  it('creates on Enter when the query matches nothing', () => {
    const onCreate = vi.fn();

    render(<Harness onCreate={onCreate} />);

    open();
    type('Shirt');
    fireEvent.keyDown(searchInput(), { key: 'Enter' });

    expect(onCreate).toHaveBeenCalledWith('Shirt');
  });

  it('leaves Enter to the active option when the query matches', () => {
    const onCreate = vi.fn();

    render(<Harness onCreate={onCreate} />);

    open();
    type('Hood');
    fireEvent.keyDown(searchInput(), { key: 'Enter' });

    expect(onCreate).not.toHaveBeenCalled();
  });

  it('creates on comma', () => {
    const onCreate = vi.fn();

    render(<Harness onCreate={onCreate} />);

    open();
    type('Shirt');
    fireEvent.keyDown(searchInput(), { key: ',' });

    expect(onCreate).toHaveBeenCalledWith('Shirt');
  });

  it('selects the exact match on comma rather than creating it', () => {
    const onCreate = vi.fn();

    render(<Harness onCreate={onCreate} />);

    open();
    type('Hoodie');
    fireEvent.keyDown(searchInput(), { key: ',' });

    expect(onCreate).not.toHaveBeenCalled();
    expect(removeButtons()).toHaveLength(1);
  });

  it('removes the last chip on Backspace in an empty input', () => {
    render(<Harness initial={[OPTIONS[0], OPTIONS[1]]} />);

    fireEvent.keyDown(searchInput(), { key: 'Backspace' });

    expect(removeButtons()).toHaveLength(1);
    expect(box()).not.toHaveTextContent('Sneakers');
  });

  it('leaves the selection alone on Backspace while text is present', () => {
    render(<Harness initial={[OPTIONS[0]]} />);

    open();
    type('Sne');
    fireEvent.keyDown(searchInput(), { key: 'Backspace' });

    expect(removeButtons()).toHaveLength(1);
  });

  it('removes a chip on Enter without the list acting on it', () => {
    render(<Harness initial={[OPTIONS[0], OPTIONS[1]]} />);

    open();
    fireEvent.keyDown(removeButtons()[0], { key: 'Enter' });
    fireEvent.click(removeButtons()[0]);

    expect(removeButtons()).toHaveLength(1);
  });
});

describe('MultiSelect caller-supplied filtering', () => {
  it('leaves filtering to the caller when onSearchChange is supplied', () => {
    const onSearchChange = vi.fn();

    render(
      <MultiSelect
        options={OPTIONS}
        value={[]}
        onChange={vi.fn()}
        onSearchChange={onSearchChange}
        placeholder={PLACEHOLDER}
      />,
    );

    open();
    type('zzz');

    expect(onSearchChange).toHaveBeenCalledWith('zzz');
    // cmdk would have filtered all three away; the caller's list stands.
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });
});

describe('MultiSelect panel slot', () => {
  it('replaces the list with the supplied content and keeps the panel open', () => {
    render(
      <MultiSelect
        options={OPTIONS}
        value={[]}
        onChange={vi.fn()}
        placeholder={PLACEHOLDER}
        panel={<button type="button">Create category</button>}
      />,
    );

    expect(screen.getByRole('button', { name: 'Create category' })).toBeInTheDocument();
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});

/**
 * Row capping is measured from `offsetTop`, which jsdom reports as 0 for
 * every element — so a rendered field here always looks like one row and the
 * cut itself can never be exercised. The cut is tested directly instead, in
 * `multi-select-rows.test.ts`. What is worth asserting here is the wiring
 * around it: that a row cap subscribes to size and that a field without one
 * pays nothing.
 */
describe('MultiSelect row capping', () => {
  const observerSpy = () => {
    const observe = vi.fn();
    const disconnect = vi.fn();
    const construct = vi.fn();

    vi.stubGlobal(
      'ResizeObserver',
      class {
        constructor(callback: ResizeObserverCallback) {
          construct(callback);
        }

        observe = observe;
        unobserve = () => undefined;
        disconnect = disconnect;
      },
    );

    return { construct, observe, disconnect };
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('observes the box when a row cap is set', () => {
    const { construct, observe } = observerSpy();

    render(<Harness initial={OPTIONS} maxVisibleRows={2} />);

    expect(construct).toHaveBeenCalled();
    expect(observe).toHaveBeenCalledWith(box());
  });

  it('creates no observer when no row cap is set', () => {
    const { construct } = observerSpy();

    render(<Harness initial={OPTIONS} />);

    expect(construct).not.toHaveBeenCalled();
  });

  it('creates no observer for a count-capped field', () => {
    const { construct } = observerSpy();

    render(<Harness initial={OPTIONS} maxVisibleChips={1} />);

    expect(construct).not.toHaveBeenCalled();
  });

  it('stops observing when unmounted', () => {
    const { disconnect } = observerSpy();

    const view = render(<Harness initial={OPTIONS} maxVisibleRows={2} />);
    view.unmount();

    expect(disconnect).toHaveBeenCalled();
  });

  it('renders every chip while nothing has been measured as overflowing', () => {
    render(<Harness initial={OPTIONS} maxVisibleRows={2} />);

    for (const option of OPTIONS) {
      expect(screen.getByText(option.title)).toBeInTheDocument();
    }

    expect(screen.queryByRole('button', { name: /more/ })).not.toBeInTheDocument();
  });
});

/**
 * In single mode a held value withdraws the input, so the shared helpers
 * built on `getByRole('combobox')` stop working once something is chosen.
 * The box is reached through the DOM instead: it is the first presentational
 * node the component renders.
 *
 * The chip filling the box is not asserted here. Every style in this project
 * is nested under the app root selector by `scoped()`, which no test DOM
 * carries, so `toHaveStyle` reads nothing back. That one is for the eye.
 */
describe('MultiSelect single selection', () => {
  const filledBox = (container: HTMLElement) => container.querySelector('[role="presentation"]')!;

  it('takes one value and closes the panel when a choice is made', () => {
    render(<Harness single />);

    open();
    fireEvent.click(optionRow('Hoodie'));

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(removeButtons()).toHaveLength(1);
    expect(screen.getByText('Hoodie')).toBeInTheDocument();
  });

  it('replaces the held option rather than adding to it', () => {
    const { container } = render(<Harness single initial={[OPTIONS[0]]} />);

    fireEvent.click(filledBox(container));
    fireEvent.click(optionRow('Sneakers'));

    expect(removeButtons()).toHaveLength(1);
    expect(screen.getByText('Sneakers')).toBeInTheDocument();
    expect(screen.queryByText('Hoodie')).not.toBeInTheDocument();
  });

  it('withdraws the text cursor while a value is held', () => {
    render(<Harness single initial={[OPTIONS[0]]} />);

    expect(screen.queryByRole('combobox')).not.toBeInTheDocument();
  });

  it('restores the cursor and its placeholder when the chip is removed', () => {
    render(<Harness single initial={[OPTIONS[0]]} />);

    fireEvent.click(removeButtons()[0]);

    expect(searchInput()).toHaveAttribute('placeholder', PLACEHOLDER);
    expect(removeButtons()).toHaveLength(0);
  });

  it('offers no checkbox on its rows, where a many-value field does', () => {
    render(<Harness single />);

    open();

    expect(optionRow('Hoodie').querySelector('[data-state]')).not.toBeInTheDocument();

    cleanup();

    render(<Harness />);

    open();

    expect(optionRow('Hoodie').querySelector('[data-state]')).toBeInTheDocument();
  });

  it('filters the list while nothing is held', () => {
    render(<Harness single />);

    open();
    type('Head');

    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(optionRow('Headwear')).toBeInTheDocument();
  });
});

describe('MultiSelect option row styling', () => {
  it("puts the caller's style on the row itself, not on its content", () => {
    render(<Harness optionStyle={(option) => ({ paddingLeft: `${option.value}px` })} />);

    open();

    expect(optionRow('Hoodie').style.paddingLeft).toBe('1px');
    expect(optionRow('Sneakers').style.paddingLeft).toBe('2px');
  });

  it('leaves the row alone when the caller returns nothing for it', () => {
    render(
      <Harness
        optionStyle={(option) => (option.value === 1 ? { paddingLeft: '8px' } : undefined)}
      />,
    );

    open();

    expect(optionRow('Hoodie').style.paddingLeft).toBe('8px');
    expect(optionRow('Sneakers')).not.toHaveAttribute('style');
  });

  it('adds no style attribute at all when no styler is supplied', () => {
    render(<Harness />);

    open();

    expect(optionRow('Hoodie')).not.toHaveAttribute('style');
  });
});
