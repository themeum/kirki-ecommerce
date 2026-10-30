<?php

namespace Kirki\Ecommerce\Tests\Unit\Services;

use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\Services\ShippingService;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class ShippingServicePickupOptionsTest extends TestCase
{
    /**
     * Make a service that offers the given methods at a flat cost, with no rules applied.
     *
     * @param array<int, array<string, mixed>> $methods Shipping method definitions.
     */
    protected function make_service(array $methods): ShippingService
    {
        return new class([], $methods) extends ShippingService {
            protected $methods;

            public function __construct(array $settings, array $methods)
            {
                parent::__construct($settings);
                $this->methods = $methods;
            }

            public function get_available_shipping_methods(array $shipping_address)
            {
                return $this->methods;
            }

            public function get_calculated_decision_context(CalculationContextDTO $context, $method = null)
            {
                return new class {
                    public function is_disabled()
                    {
                        return false;
                    }

                    public function get_shipping_cost()
                    {
                        return 900;
                    }
                };
            }
        };
    }

    /**
     * @param array<string, mixed> $overrides Keys that replace the defaults.
     * @return array<string, mixed>
     */
    protected function pickup_method(array $overrides = []): array
    {
        return array_merge([
            'id' => 'pickup',
            'name' => 'Local Pickup',
            'description' => '',
            'type' => 'local_pickup',
            'address' => '12 Main Street',
            'has_pick_time' => true,
            'pickup_time_start' => '09:00',
            'pickup_time_end' => '17:00',
        ], $overrides);
    }

    protected function options_for(array $method): array
    {
        $context = new CalculationContextDTO();

        return $this->make_service([$method])->get_final_available_shipping_options($context)[0];
    }

    public function test_pickup_option_has_address_and_times_when_pickup_time_is_on()
    {
        $option = $this->options_for($this->pickup_method());

        $this->assertSame('12 Main Street', $option['address']);
        $this->assertSame('09:00', $option['pickup_time_start']);
        $this->assertSame('17:00', $option['pickup_time_end']);
    }

    public function test_pickup_times_are_null_when_pickup_time_is_off()
    {
        $option = $this->options_for($this->pickup_method(['has_pick_time' => false]));

        $this->assertSame('12 Main Street', $option['address']);
        $this->assertNull($option['pickup_time_start']);
        $this->assertNull($option['pickup_time_end']);
    }

    public function test_both_pickup_times_are_null_when_one_is_missing()
    {
        $option = $this->options_for($this->pickup_method(['pickup_time_end' => null]));

        $this->assertNull($option['pickup_time_start']);
        $this->assertNull($option['pickup_time_end']);
    }

    public function test_other_methods_have_null_address_and_times()
    {
        $option = $this->options_for($this->pickup_method(['type' => 'flat_rate']));

        $this->assertNull($option['address']);
        $this->assertNull($option['pickup_time_start']);
        $this->assertNull($option['pickup_time_end']);
    }
}
