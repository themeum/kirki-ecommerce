import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  type SheetSide,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PORTAL_ROOT_ID } from '@/libs/portal-container';

const renderSheet = (side?: SheetSide) => {
  render(
    <Sheet>
      <SheetTrigger>Open settings</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Customize analytics</SheetTitle>
          <SheetDescription>Choose what the page shows.</SheetDescription>
        </SheetHeader>
        <p>Body</p>
        <SheetFooter>
          <SheetClose>Done</SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>,
  );
};

describe('Sheet', () => {
  afterEach(() => {
    cleanup();
  });

  it('opens from the trigger with the title as its accessible name', () => {
    renderSheet();

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    const dialog = screen.getByRole('dialog', { name: 'Customize analytics' });

    expect(dialog).toHaveAccessibleDescription('Choose what the page shows.');
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('opens from the right by default', () => {
    renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'right');
  });

  it('opens from the side it is given', () => {
    renderSheet('left');
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(screen.getByRole('dialog')).toHaveAttribute('data-side', 'left');
  });

  it('closes on Escape and gives the focus back to the trigger', async () => {
    renderSheet();
    const trigger = screen.getByRole('button', { name: 'Open settings' });

    trigger.focus();
    fireEvent.click(trigger);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    await waitFor(() => {
      expect(trigger).toHaveFocus();
    });
  });

  it('sits above the WordPress admin bar', () => {
    const wpBody = document.createElement('div');
    const root = document.createElement('div');

    wpBody.id = 'wpbody-content';
    root.id = PORTAL_ROOT_ID;
    root.className = 'kirki-ecommerce-root';
    wpBody.appendChild(root);
    document.body.appendChild(wpBody);

    renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    const dialog = screen.getByRole('dialog');
    const overlay = dialog.previousElementSibling!;

    expect(Number(window.getComputedStyle(dialog).zIndex)).toBeGreaterThan(99999);
    expect(Number(window.getComputedStyle(overlay).zIndex)).toBeGreaterThan(99999);

    wpBody.remove();
  });

  it('closes from the close button', () => {
    renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes from a SheetClose', () => {
    renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('follows a controlled open state', () => {
    const onOpenChange = vi.fn();

    const Controlled = () => {
      const [isOpen, setIsOpen] = useState(true);

      return (
        <Sheet
          open={isOpen}
          onOpenChange={(next) => {
            onOpenChange(next);
            setIsOpen(next);
          }}
        >
          <SheetContent>
            <SheetTitle>Controlled</SheetTitle>
            <SheetDescription>Text</SheetDescription>
          </SheetContent>
        </Sheet>
      );
    };

    render(<Controlled />);

    expect(screen.getByRole('dialog', { name: 'Controlled' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
