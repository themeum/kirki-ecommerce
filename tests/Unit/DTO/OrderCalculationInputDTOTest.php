<?php

namespace Kirki\Ecommerce\Tests\Unit\DTO;

use Kirki\Ecommerce\App\DTO\Calculation\OrderCalculationInputDTO;
use Kirki\Ecommerce\App\DTO\Calculation\OrderCalculationLineDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\DTO\Order\UpdateOrderPayloadDTO;
use Kirki\Ecommerce\Tests\Unit\TestCase;

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
