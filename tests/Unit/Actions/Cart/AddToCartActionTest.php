<?php

namespace Kirki\Ecommerce\Tests\Unit\Actions\Cart;

use Kirki\Ecommerce\App\Actions\Cart\AddToCartAction;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\DTO\Cart\AddToCartDTO;
use Kirki\Ecommerce\App\Models\Cart;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\CartService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class AddToCartActionTest extends TestCase
{
    /**
     * A variant marked not visible fails the availability guard before the
     * cart or inventory are ever consulted.
     *
     * @return void
     */
    public function test_throws_when_variant_is_not_visible(): void
    {
        $variant_service = $this->createMock(VariantService::class);
        $variant_service->method('find')->willReturn($this->make_variant(false, ProductStatus::PUBLISHED));

        $cart_service = $this->createMock(CartService::class);
        $cart_service->expects($this->never())->method('get_cart');

        $inventory_service = $this->createMock(InventoryService::class);
        $inventory_service->expects($this->never())->method('has_stock');

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('This item is no longer available.');
        $this->expectExceptionCode(Response::UNPROCESSABLE_ENTITY);

        $this->make_action([
            'variant_service' => $variant_service,
            'cart_service' => $cart_service,
            'inventory_service' => $inventory_service,
        ])->execute($this->make_dto());
    }

    /**
     * A variant whose product has been trashed fails the availability guard
     * before the cart or inventory are ever consulted.
     *
     * @return void
     */
    public function test_throws_when_variant_belongs_to_a_trashed_product(): void
    {
        $variant_service = $this->createMock(VariantService::class);
        $variant_service->method('find')->willReturn($this->make_variant(true, ProductStatus::TRASHED));

        $cart_service = $this->createMock(CartService::class);
        $cart_service->expects($this->never())->method('get_cart');

        $inventory_service = $this->createMock(InventoryService::class);
        $inventory_service->expects($this->never())->method('has_stock');

        $this->expectException(ValidationException::class);
        $this->expectExceptionMessage('This item is no longer available.');
        $this->expectExceptionCode(Response::UNPROCESSABLE_ENTITY);

        $this->make_action([
            'variant_service' => $variant_service,
            'cart_service' => $cart_service,
            'inventory_service' => $inventory_service,
        ])->execute($this->make_dto());
    }

    /**
     * A visible variant on a published product still passes the guard and
     * is added to the cart as before.
     *
     * @return void
     */
    public function test_adds_available_variant_to_cart(): void
    {
        $variant = $this->make_variant(true, ProductStatus::PUBLISHED);
        $variant->product_id = 55;

        $variant_service = $this->createMock(VariantService::class);
        $variant_service->method('find')->with(10)->willReturn($variant);

        $cart = new Cart();
        $cart->id = 3;

        $cart_service = $this->createMock(CartService::class);
        $cart_service->method('get_cart')->willReturn(null);
        $cart_service->expects($this->never())->method('find_item_in_cart');
        $cart_service->method('get_or_create_cart')->willReturn($cart);
        $cart_service->expects($this->once())->method('add_item_to_cart');
        $cart_service->method('find')->with(3)->willReturn($cart);

        $inventory_service = $this->createMock(InventoryService::class);
        $inventory_service->method('has_stock')->willReturn(true);
        $inventory_service->method('is_within_limit')->willReturn(true);

        $result = $this->make_action([
            'variant_service' => $variant_service,
            'cart_service' => $cart_service,
            'inventory_service' => $inventory_service,
        ])->execute($this->make_dto(['variant_id' => 10]));

        $this->assertSame($cart, $result);
    }

    protected function make_variant(bool $is_visible, string $product_status): Variant
    {
        $variant = new Variant();
        $variant->is_visible = $is_visible;

        $product = new Product();
        $product->status = $product_status;

        $variant->set_relation('product', $product);

        return $variant;
    }

    protected function make_dto(array $overrides = []): AddToCartDTO
    {
        $dto = new AddToCartDTO();
        $dto->user_id = $overrides['user_id'] ?? 1;
        $dto->token = $overrides['token'] ?? null;
        $dto->variant_id = $overrides['variant_id'] ?? 10;
        $dto->quantity = $overrides['quantity'] ?? 1;

        return $dto;
    }

    /**
     * @param array{cart_service?: object, variant_service?: object, inventory_service?: object} $overrides
     * @return AddToCartAction
     */
    protected function make_action(array $overrides = []): AddToCartAction
    {
        $cart_service = $overrides['cart_service'] ?? $this->createMock(CartService::class);
        $variant_service = $overrides['variant_service'] ?? $this->createMock(VariantService::class);
        $inventory_service = $overrides['inventory_service'] ?? $this->createMock(InventoryService::class);

        return new AddToCartAction($cart_service, $variant_service, $inventory_service);
    }
}
