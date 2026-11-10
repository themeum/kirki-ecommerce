<?php

namespace Kirki\Ecommerce\Tests\Unit\DTO;

use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\App\Models\CartItem;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\Framework\Container;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\collection;

class CalculationContextDTOTest extends TestCase
{
    /**
     * Make a cart that holds one line per given `charge_taxes` value.
     *
     * @param bool[] $charge_taxes_per_line Value of `charge_taxes` of the variant of each line.
     * @return Cart
     */
    protected function make_cart(array $charge_taxes_per_line): Cart
    {
        $this->bootstrap_application();

        $customer_service = $this->createMock(CustomerService::class);
        $customer_service->method('resolve_buyer_email')->willReturn(null);
        Container::get_instance()->instance(CustomerService::class, $customer_service);

        $items = [];

        foreach ($charge_taxes_per_line as $index => $charge_taxes) {
            $product = new class() extends Product {
                /** @inheritDoc */
                public function load($relations)
                {
                    return $this;
                }
            };
            $product->id = 50 + $index;
            $product->tax_profile_id = null;
            $product->set_relation('categories', collection([]));

            $variant = new Variant();
            $variant->id = 1 + $index;
            $variant->base_price = 3000;
            $variant->base_sale_price = null;
            $variant->tax_profile_id = null;
            $variant->charge_taxes = $charge_taxes;

            $item = new CartItem();
            $item->id = 100 + $index;
            $item->variant_id = $variant->id;
            $item->product_id = $product->id;
            $item->quantity = 1;
            $item->set_relation('variant', $variant);
            $item->set_relation('product', $product);

            $items[] = $item;
        }

        $cart = new Cart();
        $cart->id = 9;
        $cart->user_id = null;
        $cart->set_relation('items', collection($items));
        $cart->set_relation('coupons', collection([]));

        return $cart;
    }

    public function test_from_cart_copies_charge_taxes_from_each_variant(): void
    {
        $context = CalculationContextDTO::from_cart($this->make_cart([false, true]));

        $items = $context->items->all();

        $this->assertFalse($items[0]->charge_taxes);
        $this->assertTrue($items[1]->charge_taxes);
    }
}
