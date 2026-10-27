<?php

namespace Kirki\Ecommerce\Tests\Unit\DTO;

use Kirki\Ecommerce\App\DTO\Calculation\OrderCalculationInputDTO;
use Kirki\Ecommerce\App\DTO\Calculation\OrderCalculationLineDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderPayloadDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderCoupon;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\collection;

class OrderCalculationInputDTOTest extends TestCase
{
    public function test_it_reads_the_fields_the_builder_needs_from_a_payload(): void
    {
        $input = OrderCalculationInputDTO::from_payload([
            'customer_id' => 5,
            'customer_email' => 'buyer@example.com',
            'coupon_codes' => ['SAVE10'],
            'shipping_method' => 'method-0001',
            'payment_provider' => 'stripe',
            'items' => [['id' => 8, 'quantity' => 2], ['variant_id' => 3, 'quantity' => 1]],
        ]);

        $this->assertSame(5, $input->customer_id);
        $this->assertSame('buyer@example.com', $input->customer_email);
        $this->assertSame(['SAVE10'], $input->coupon_codes);
        $this->assertSame('method-0001', $input->shipping_method);
        $this->assertFalse(property_exists($input, 'payment_provider'));
    }

    public function test_it_keeps_the_keys_of_the_lines(): void
    {
        $input = OrderCalculationInputDTO::from_payload(['items' => [3 => ['variant_id' => 3, 'quantity' => 1], 'b' => ['id' => 8, 'quantity' => 2]]]);

        $this->assertSame([3, 'b'], array_keys($input->items));
        $this->assertInstanceOf(OrderCalculationLineDTO::class, $input->items[3]);
        $this->assertSame(3, $input->items[3]->variant_id);
        $this->assertNull($input->items[3]->id);
        $this->assertSame(8, $input->items['b']->id);
        $this->assertSame(2, $input->items['b']->quantity);
    }

    public function test_it_is_made_from_a_stored_order_as_the_payload_that_sends_it_back_unchanged(): void
    {
        $first_item = new OrderItem();
        $first_item->id = 301;
        $first_item->quantity = 3;
        $second_item = new OrderItem();
        $second_item->id = 302;
        $second_item->quantity = 1;
        $coupon = new OrderCoupon();
        $coupon->code = 'SAVE10';

        $order = new Order();
        $order->customer_id = 5;
        $order->customer_email = 'buyer@example.com';
        $order->shipping_method = 'method-0001';
        $order->shipping_city = 'New York';
        $order->shipping_country = 'US';
        $order->billing_country = 'CA';
        $order->set_relation('items', collection([$first_item, $second_item]));
        $order->set_relation('order_coupons', collection([$coupon]));

        $input = OrderCalculationInputDTO::from_order($order);

        $this->assertSame(5, $input->customer_id);
        $this->assertSame('buyer@example.com', $input->customer_email);
        $this->assertSame('method-0001', $input->shipping_method);
        $this->assertSame(['SAVE10'], $input->coupon_codes);
        $this->assertSame([301, 302], array_map(fn($line) => $line->id, $input->items));
        $this->assertSame([3, 1], array_map(fn($line) => $line->quantity, $input->items));
        $this->assertSame('New York', $input->get_address('shipping')['city']);
        $this->assertSame('US', $input->get_address('shipping')['country']);
        $this->assertSame('CA', $input->get_address('billing')['country']);
    }

    public function test_it_defaults_to_no_lines_and_no_coupons(): void
    {
        $input = OrderCalculationInputDTO::from_payload(['coupon_codes' => null]);

        $this->assertSame([], $input->items);
        $this->assertSame([], $input->coupon_codes);
    }

    public function test_it_picks_one_address_out_of_the_flat_fields(): void
    {
        $input = OrderCalculationInputDTO::from_payload(['shipping_city' => 'New York', 'shipping_country' => 'US', 'billing_country' => 'CA']);

        $this->assertSame('New York', $input->get_address('shipping')['city']);
        $this->assertSame('US', $input->get_address('shipping')['country']);
        $this->assertSame('CA', $input->get_address('billing')['country']);
        $this->assertNull($input->get_address('billing')['city']);
        $this->assertSame(['first_name', 'last_name', 'email', 'phone', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'], array_keys($input->get_address('shipping')));
    }

    public function test_a_create_payload_gives_its_calculation_input(): void
    {
        $dto = CreateOrderPayloadDTO::from_array([
            'items' => [['variant_id' => 3, 'quantity' => 2]],
            'coupon_codes' => ['SAVE10'],
            'shipping_method' => 'method-0001',
            'shipping_country' => 'US',
        ]);

        $input = $dto->to_calculation_input();

        $this->assertSame(3, $input->items[0]->variant_id);
        $this->assertSame(['SAVE10'], $input->coupon_codes);
        $this->assertSame('method-0001', $input->shipping_method);
        $this->assertSame('US', $input->get_address('shipping')['country']);
    }

    public function test_an_update_payload_gives_its_calculation_input(): void
    {
        $dto = UpdateOrderPayloadDTO::from_array([
            'id' => 77,
            'items' => [['id' => 8, 'quantity' => 4]],
            'billing_country' => 'CA',
        ]);

        $input = $dto->to_calculation_input();

        $this->assertSame(8, $input->items[0]->id);
        $this->assertSame(4, $input->items[0]->quantity);
        $this->assertSame('CA', $input->get_address('billing')['country']);
    }
}
