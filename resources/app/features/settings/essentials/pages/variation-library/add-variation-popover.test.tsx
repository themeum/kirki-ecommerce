import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AddVariationPopover from '@/features/settings/essentials/pages/variation-library/add-variation-popover';

const renderPopover = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const onClose = vi.fn();

  render(
    <QueryClientProvider client={queryClient}>
      <AddVariationPopover onClose={onClose} />
    </QueryClientProvider>,
  );

  return { onClose, trigger: screen.getByRole('button', { name: 'Add Variation' }) };
};

const openMenu = (trigger: HTMLElement) => {
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false, pointerType: 'mouse' });
};

const selectType = async (label: string) => {
  fireEvent.click(screen.getByRole('menuitem', { name: label }));
  await screen.findByLabelText('Title');
};

afterEach(cleanup);

describe('AddVariationPopover', () => {
  it('offers the variation types without showing the form', () => {
    const { trigger } = renderPopover();

    openMenu(trigger);

    expect(screen.getByRole('menuitem', { name: 'Color' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'List' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('opens the name form in a popover once a type is picked', async () => {
    const { trigger } = renderPopover();

    openMenu(trigger);
    await selectType('Color');

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('e.g Color')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('uses the list placeholder for a list variation', async () => {
    const { trigger } = renderPopover();

    openMenu(trigger);
    await selectType('List');

    expect(screen.getByPlaceholderText('e.g Material')).toBeInTheDocument();
  });

  it('closes the form and reports it when cancel is clicked', async () => {
    const { trigger, onClose } = renderPopover();

    openMenu(trigger);
    await selectType('List');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
    expect(onClose).toHaveBeenCalled();
  });

  it('wires the name field to a submit button so Enter saves', async () => {
    const { trigger } = renderPopover();

    openMenu(trigger);
    await selectType('List');

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toHaveAttribute('type', 'submit');
    expect(saveButton.closest('form')).toContainElement(screen.getByLabelText('Title'));
  });
});
