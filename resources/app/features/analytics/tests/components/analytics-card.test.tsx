import { act, cleanup, fireEvent, screen } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';

import AnalyticsCard from '@/features/analytics/components/analytics-card';
import AnalyticsCardTitle from '@/features/analytics/components/analytics-card-title';
import { CardMenuContext } from '@/features/analytics/components/card-menu';

import { effectiveOpacity, getOpacityRules, renderInRoot } from '../helpers';

const INFO = 'Orders created in the range, paid or not. Failed payments are left out.';

const renderCard = () => {
  return renderInRoot(
    <AnalyticsCard title="Orders" info={INFO}>
      <p>Body</p>
    </AnalyticsCard>,
  );
};

describe('AnalyticsCardTitle', () => {
  afterEach(cleanup);

  it('puts the info icon right after the title', () => {
    renderInRoot(<AnalyticsCardTitle title="Orders" info={INFO} />);

    const title = screen.getByText('Orders');
    const icon = screen.getByRole('button', { name: INFO });

    expect(title.compareDocumentPosition(icon) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('makes the tooltip text the accessible name of the icon', () => {
    renderInRoot(<AnalyticsCardTitle title="Orders" info={INFO} />);

    expect(screen.getByRole('button', { name: INFO })).toBeInTheDocument();
  });

  it('can be reached with the keyboard', () => {
    renderInRoot(<AnalyticsCardTitle title="Orders" info={INFO} />);

    const icon = screen.getByRole('button', { name: INFO });

    expect(icon.tabIndex).toBeGreaterThanOrEqual(0);
    act(() => icon.focus());
    expect(document.activeElement).toBe(icon);
  });
});

describe('AnalyticsCard', () => {
  afterEach(cleanup);

  it('shows the title and the body', () => {
    renderCard();

    expect(screen.getByText('Orders')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  // Scenario: Icon is hidden until hover
  it('hides the info icon while the pointer is away and nothing has focus', () => {
    renderCard();

    expect(effectiveOpacity(screen.getByRole('button', { name: INFO }))).toBe(0);
  });

  // Scenario: Hover shows the icon and tooltip (the icon part: jsdom never matches :hover, so the rule is read)
  it('has a style rule that shows the icon while the pointer is over the card', () => {
    renderCard();

    const rules = getOpacityRules();

    expect(
      rules.some(
        (rule) => rule.selector.includes(':hover') && rule.opacity === '1' && rule.media === null,
      ),
    ).toBe(true);
  });

  // Scenario: Hover shows the icon and tooltip (the tooltip part)
  it('opens the tooltip with the calculation text when the pointer is over the icon', async () => {
    renderCard();

    fireEvent.pointerMove(screen.getByRole('button', { name: INFO }));

    const tooltips = await screen.findAllByRole('tooltip');

    expect(tooltips[0]).toHaveTextContent(INFO);
  });

  // Scenario: Keyboard
  it('shows the icon and opens its tooltip when the icon gets keyboard focus', async () => {
    renderCard();
    const icon = screen.getByRole('button', { name: INFO });

    act(() => icon.focus());

    expect(effectiveOpacity(icon)).toBe(1);
    expect((await screen.findAllByRole('tooltip'))[0]).toHaveTextContent(INFO);
  });

  it('shows the icon when anything inside the card has focus', () => {
    renderInRoot(
      <AnalyticsCard title="Orders" info={INFO}>
        <button type="button">Inside</button>
      </AnalyticsCard>,
    );

    act(() => screen.getByRole('button', { name: 'Inside' }).focus());

    expect(effectiveOpacity(screen.getByRole('button', { name: INFO }))).toBe(1);
  });

  // Scenario: Touch device
  it('has a style rule that always shows the icon on devices without hover', () => {
    renderCard();

    const rules = getOpacityRules();

    expect(
      rules.some((rule) => rule.opacity === '1' && /hover:\s*none/.test(rule.media ?? '')),
    ).toBe(true);
  });
});

describe('AnalyticsCard menu', () => {
  beforeAll(() => {
    Element.prototype.hasPointerCapture = vi.fn(() => false);
    Element.prototype.setPointerCapture = vi.fn();
    Element.prototype.releasePointerCapture = vi.fn();
  });

  afterEach(() => {
    cleanup();
  });

  const renderWithMenu = (canHide: boolean) => {
    const onHide = vi.fn();

    renderInRoot(
      <CardMenuContext.Provider value={{ canHide, onHide }}>
        <AnalyticsCard title="Orders" info={INFO}>
          <p>Body</p>
        </AnalyticsCard>
      </CardMenuContext.Provider>,
    );

    return { onHide };
  };

  const openMenu = () => {
    const trigger = screen.getByRole('button', { name: 'More actions for Orders' });

    fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });

    return trigger;
  };

  it('has no menu without a menu context', () => {
    renderCard();

    expect(
      screen.queryByRole('button', { name: 'More actions for Orders' }),
    ).not.toBeInTheDocument();
  });

  it('has only the Hide from page item, and hides the card on select', () => {
    const { onHide } = renderWithMenu(true);

    openMenu();

    expect(screen.getAllByRole('menuitem')).toHaveLength(1);

    fireEvent.click(screen.getByRole('menuitem', { name: 'Hide from page' }));

    expect(onHide).toHaveBeenCalledTimes(1);
  });

  it('disables Hide from page for the last item of a group', () => {
    const { onHide } = renderWithMenu(false);

    openMenu();
    const item = screen.getByRole('menuitem', { name: 'Hide from page' });

    expect(item).toHaveAttribute('data-disabled');

    fireEvent.click(item);

    expect(onHide).not.toHaveBeenCalled();
  });

  // Scenario: Button is hidden until hover
  it('hides the menu button while the pointer is away', () => {
    renderWithMenu(true);

    expect(effectiveOpacity(screen.getByRole('button', { name: 'More actions for Orders' }))).toBe(
      0,
    );
  });

  it('shows the menu button when the card has keyboard focus', () => {
    renderWithMenu(true);
    const trigger = screen.getByRole('button', { name: 'More actions for Orders' });

    act(() => trigger.focus());

    expect(effectiveOpacity(trigger)).toBe(1);
  });

  it('shows the menu button while the menu is open', () => {
    renderWithMenu(true);
    const trigger = openMenu();

    expect(trigger).toHaveAttribute('data-state', 'open');
    expect(effectiveOpacity(trigger)).toBe(1);
  });

  // Scenario: Touch device
  it('shows the menu button on devices without hover', () => {
    renderWithMenu(true);

    expect(
      getOpacityRules().some(
        (rule) =>
          rule.selector.includes('data-card-menu') &&
          rule.opacity === '1' &&
          /hover:\s*none/.test(rule.media ?? ''),
      ),
    ).toBe(true);
  });
});
