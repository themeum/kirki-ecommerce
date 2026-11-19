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
  SheetSeparator,
  type SheetSide,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { PORTAL_ROOT_ID } from '@/libs/portal-container';

const getHeader = () => {
  return screen.getByRole('button', { name: 'Close' }).parentElement!.parentElement!;
};

const renderSheet = (side?: SheetSide) => {
  render(
    <Sheet>
      <SheetTrigger>Open settings</SheetTrigger>
      <SheetContent side={side}>
        <SheetHeader>
          <SheetTitle>Customize analytics</SheetTitle>
          <SheetDescription>Choose what the page shows.</SheetDescription>
        </SheetHeader>
        <SheetSeparator />
        <p>Body</p>
        <SheetSeparator />
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
            <SheetHeader>
              <SheetTitle>Controlled</SheetTitle>
              <SheetDescription>Text</SheetDescription>
            </SheetHeader>
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

  it('shows the close button in the header, next to the title', () => {
    renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    const header = getHeader();

    expect(header).toContainElement(screen.getByText('Customize analytics'));
    expect(header).toContainElement(screen.getByRole('button', { name: 'Close' }));
  });

  it('draws the separators across the panel', () => {
    renderSheet();
    fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));

    expect(
      screen.getByRole('dialog').querySelectorAll('[data-orientation="horizontal"]'),
    ).toHaveLength(2);
  });
});

const FLOAT_KEY = 'test:sheet-float';

const renderFloatableSheet = (floating = true) => {
  const content = (
    <>
      <SheetTrigger>Open settings</SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Customize home</SheetTitle>
          <SheetDescription>Choose what the page shows.</SheetDescription>
        </SheetHeader>
        <p>Body</p>
      </SheetContent>
    </>
  );

  render(
    floating ? (
      <Sheet floating storageKey={FLOAT_KEY}>
        {content}
      </Sheet>
    ) : (
      <Sheet>{content}</Sheet>
    ),
  );
  fireEvent.click(screen.getByRole('button', { name: 'Open settings' }));
};

const dragHeader = (toX: number, toY: number) => {
  const header = getHeader();

  fireEvent.pointerDown(header, { button: 0, clientX: 0, clientY: 0 });
  fireEvent.pointerMove(window, { clientX: toX, clientY: toY });
  fireEvent.pointerUp(window);
};

describe('Floating sheet', () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    window.innerWidth = 1024;
  });

  it('has no move handle when the option is off', () => {
    renderFloatableSheet(false);

    expect(document.querySelector('[data-draggable]')).toBeNull();

    dragHeader(300, 200);

    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-floating');
  });

  it('floats where the header is dropped, with no overlay', () => {
    renderFloatableSheet();
    dragHeader(300, 200);

    const dialog = screen.getByRole('dialog', { name: 'Customize home' });

    expect(dialog).toHaveAttribute('data-floating', 'true');
    expect(dialog.style.left).toBe('300px');
    expect(dialog.style.top).toBe('200px');
    expect(dialog.previousElementSibling).not.toHaveAttribute('data-state');
    expect(getHeader()).toContainElement(
      screen.getByRole('button', { name: 'Dock to the right' }),
    );
  });

  it('docks again from the dock button', () => {
    renderFloatableSheet();
    dragHeader(300, 200);
    fireEvent.click(screen.getByRole('button', { name: 'Dock to the right' }));

    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-floating');
    expect(screen.queryByRole('button', { name: 'Dock to the right' })).not.toBeInTheDocument();
  });

  it('does not close when the page is clicked while floating', () => {
    renderFloatableSheet();
    dragHeader(300, 200);
    fireEvent.pointerDown(document.body);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('closes on Escape while floating', () => {
    renderFloatableSheet();
    dragHeader(300, 200);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens floating at the remembered place', () => {
    window.localStorage.setItem(FLOAT_KEY, JSON.stringify({ mode: 'floating', x: 120, y: 80 }));
    renderFloatableSheet();

    const dialog = screen.getByRole('dialog');

    expect(dialog).toHaveAttribute('data-floating', 'true');
    expect(dialog.style.left).toBe('120px');
    expect(dialog.style.top).toBe('80px');
  });

  it('moves a remembered place that is off the screen back inside it', () => {
    window.localStorage.setItem(FLOAT_KEY, JSON.stringify({ mode: 'floating', x: 5000, y: -40 }));
    renderFloatableSheet();

    const dialog = screen.getByRole('dialog');

    expect(dialog.style.left).toBe(`${window.innerWidth - 16}px`);
    expect(dialog.style.top).toBe('16px');
  });

  it('remembers the floating place after it closes', () => {
    renderFloatableSheet();
    dragHeader(300, 200);

    expect(JSON.parse(window.localStorage.getItem(FLOAT_KEY) ?? '{}')).toEqual({
      mode: 'floating',
      x: 300,
      y: 200,
    });
  });

  it('does not float on a narrow screen', () => {
    window.innerWidth = 500;
    renderFloatableSheet();
    dragHeader(300, 200);

    expect(screen.getByRole('dialog')).not.toHaveAttribute('data-floating');
  });
});
