import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import Button from '@/components/ui/button';
import type { AttributeValue } from '@/features/products';
import VariationValuePopover from '@/features/settings/essentials/pages/variation-library/variation-value-popover';

const attribute = { id: 7, name: 'Color', type: 'color', values: [] };

const renderPopover = ({
  isOpen = false,
  type = 'list',
  onOpenChange = vi.fn(),
  editedItem = null,
}: {
  isOpen?: boolean;
  type?: string;
  onOpenChange?: (open: boolean) => void;
  editedItem?: AttributeValue | null;
} = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <VariationValuePopover
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        type={type}
        selectedItem={{ ...attribute, type }}
        editedItem={editedItem}
      >
        <Button>Add value</Button>
      </VariationValuePopover>
    </QueryClientProvider>,
  );

  return onOpenChange;
};

afterEach(cleanup);

describe('VariationValuePopover', () => {
  it('renders the trigger without the form while it is closed', () => {
    renderPopover();

    expect(screen.getByRole('button', { name: 'Add value' })).toBeInTheDocument();
    expect(screen.queryByLabelText('Title')).not.toBeInTheDocument();
  });

  it('asks to open when the trigger is clicked', () => {
    const onOpenChange = renderPopover();

    fireEvent.click(screen.getByRole('button', { name: 'Add value' }));

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('shows the value form anchored to the trigger while it is open', () => {
    renderPopover({ isOpen: true });

    expect(screen.getByLabelText('Title')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a value')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('adds the color picker for a color variation', () => {
    renderPopover({ isOpen: true, type: 'color' });

    expect(screen.getByPlaceholderText('Add a color')).toBeInTheDocument();
    expect(screen.getByText('Color')).toBeInTheDocument();
  });

  it('asks to close when cancel is clicked', () => {
    const onOpenChange = renderPopover({ isOpen: true });

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it('enables save once the value is filled', () => {
    renderPopover({ isOpen: true });

    fireEvent.change(screen.getByLabelText('Title'), { target: { value: 'Small' } });

    expect(screen.getByRole('button', { name: 'Save' })).toBeEnabled();
  });

  it('wires the value field to a submit button so Enter saves', () => {
    renderPopover({ isOpen: true });

    const saveButton = screen.getByRole('button', { name: 'Save' });

    expect(saveButton).toHaveAttribute('type', 'submit');
    expect(saveButton.closest('form')).toContainElement(screen.getByLabelText('Title'));
  });

  it('fills the colour from a recognised name when the title blurs', () => {
    renderPopover({ isOpen: true, type: 'color' });

    const title = screen.getByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Green' } });
    fireEvent.blur(title);

    expect(screen.getByText('#00ff00')).toBeInTheDocument();
  });

  it('re-fills the colour when the name changes again', () => {
    renderPopover({ isOpen: true, type: 'color' });

    const title = screen.getByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Green' } });
    fireEvent.blur(title);
    fireEvent.change(title, { target: { value: 'Tomato' } });
    fireEvent.blur(title);

    expect(screen.getByText('#ff6347')).toBeInTheDocument();
  });

  it('leaves a colour the user picked alone', () => {
    renderPopover({ isOpen: true, type: 'color' });

    fireEvent.click(screen.getByLabelText('Color'));
    fireEvent.change(screen.getByPlaceholderText('#007ba7'), {
      target: { value: '#123456' },
    });

    const title = screen.getByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Green' } });
    fireEvent.blur(title);

    expect(screen.getByText('#123456')).toBeInTheDocument();
  });

  it('does not touch the colour of an existing value', () => {
    renderPopover({
      isOpen: true,
      type: 'color',
      editedItem: { id: 3, value: 'Emerald', color: '#123456' },
    });

    const title = screen.getByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Green' } });
    fireEvent.blur(title);

    expect(screen.getByText('#123456')).toBeInTheDocument();
  });

  it('ignores a title that is not a colour name', () => {
    renderPopover({ isOpen: true, type: 'color' });

    const title = screen.getByLabelText('Title');
    fireEvent.change(title, { target: { value: 'Sunset Vibes' } });
    fireEvent.blur(title);

    expect(screen.getByText('#007ba7')).toBeInTheDocument();
  });
});
