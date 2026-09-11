import { cleanup, render, screen } from '@testing-library/react';
import { forwardRef } from 'react';
import { afterEach, describe, expect, it } from 'vitest';

import { DropdownMenu, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { scoped, scopedMerge } from '@/theme/mixins';

const Card = () => {
  return <div data-testid="card" css={scoped('card-L15', { color: 'red' })} />;
};

const MergedCard = () => {
  return <div data-testid="merged" css={scopedMerge('card-L15', { color: 'red' })} />;
};

const ProductForm = () => <Card />;
const OrderDetails = () => <Card />;

const Wrapper = forwardRef<HTMLDivElement>((_props, ref) => (
  <div ref={ref}>
    <Card />
  </div>
));

Wrapper.displayName = 'ShippingPanel';

const getLabel = (testId: string) => {
  return screen.getByTestId(testId).className.split('-').slice(2).join('-');
};

describe('scoped() owner labels', () => {
  afterEach(cleanup);

  it('prefixes the label with the component that rendered it', () => {
    render(<ProductForm />);

    expect(getLabel('card')).toBe('product-form-card-L15');
  });

  it('gives the same component a different label per consumer', () => {
    render(<OrderDetails />);

    expect(getLabel('card')).toBe('order-details-card-L15');
  });

  it('resolves the owner through forwardRef displayName', () => {
    render(<Wrapper />);

    expect(getLabel('card')).toBe('shipping-panel-card-L15');
  });

  it('leaves the label alone when there is no owner', () => {
    render(<Card />);

    expect(getLabel('card')).toBe('card-L15');
  });

  it('does not repeat the owner name already present in the label', () => {
    const VariantRow = () => (
      <div data-testid="own" css={scoped('variant-list-L42', { color: 'red' })} />
    );
    const VariantList = () => <VariantRow />;

    render(<VariantList />);

    expect(getLabel('own')).toBe('variant-list-L42');
  });

  it('applies the owner prefix through scopedMerge too', () => {
    const MergedHost = () => <MergedCard />;

    render(<MergedHost />);

    expect(getLabel('merged')).toBe('merged-host-card-L15');
  });

  it('skips namespaced library owners that would produce an unusable selector', () => {
    render(
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Card />
        </DropdownMenuTrigger>
      </DropdownMenu>,
    );

    const className = screen.getByTestId('card').className;

    expect(className).not.toContain('.');
    expect(document.querySelectorAll(`.${className}`)).toHaveLength(1);
    expect(getLabel('card')).toBe('card-L15');
  });
});
