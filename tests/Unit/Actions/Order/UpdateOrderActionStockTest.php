<?php

namespace Kirki\Ecommerce\Tests\Unit\Actions\Order;

use Kirki\Ecommerce\App\Actions\Order\UpdateOrderAction;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Tests\Unit\TestCase;
use ReflectionClass;

class UpdateOrderActionStockTest extends TestCase
{
    /**
     * A stock shortage found in the save's own step for a new line is a 422, not a 500.
     *
     * @return void
     */
    public function test_a_new_line_without_stock_fails_with_a_422_error(): void
    {
        $calculated_item = new CalculationItemDTO();
        $calculated_item->variant_id = 4;
        $calculated_item->quantity = 2;

        $this->expect_unprocessable_stock_error();

        $this->call($this->make_action(), 'add_order_item', [new Order(), $calculated_item, 'USD', 1.0]);
    }

    /**
     * A stock shortage found in the save's own step for a raised quantity is a 422, not a 500.
     *
     * @return void
     */
    public function test_a_raised_quantity_without_stock_fails_with_a_422_error(): void
    {
        $stored_item = new OrderItem();
        $stored_item->variant_id = 4;
        $stored_item->quantity = 1;

        $calculated_item = new CalculationItemDTO();
        $calculated_item->quantity = 3;

        $this->expect_unprocessable_stock_error();

        $this->call($this->make_action(), 'update_order_item', [new Order(), $stored_item, $calculated_item, 'USD', 1.0]);
    }

    /**
     * @return void
     */
    protected function expect_unprocessable_stock_error(): void
    {
        $this->expectException(ValidationException::class);
        $this->expectExceptionCode(Response::UNPROCESSABLE_ENTITY);
        $this->expectExceptionMessage('Not enough stock for variant: 4');
    }

    /**
     * Make the action without its constructor, with an inventory service that has no stock.
     *
     * @return UpdateOrderAction
     */
    protected function make_action(): UpdateOrderAction
    {
        $inventory_service = $this->createMock(InventoryService::class);
        $inventory_service->method('has_stock')->willReturn(false);
        $inventory_service->expects($this->never())->method('reserve_stock');

        $action = (new ReflectionClass(UpdateOrderAction::class))->newInstanceWithoutConstructor();
        $property = new \ReflectionProperty(UpdateOrderAction::class, 'inventory_service');
        $property->setAccessible(true);
        $property->setValue($action, $inventory_service);

        return $action;
    }

    /**
     * @param UpdateOrderAction $action    Action to call.
     * @param string            $method    Protected method name.
     * @param array<int, mixed> $arguments Method arguments.
     * @return mixed
     */
    protected function call(UpdateOrderAction $action, string $method, array $arguments)
    {
        $reflection = new \ReflectionMethod(UpdateOrderAction::class, $method);
        $reflection->setAccessible(true);

        return $reflection->invokeArgs($action, $arguments);
    }
}
