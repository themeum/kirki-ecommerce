<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Constants\Order\FulfillmentStatus;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\Http\Requests\Order\OrderCalculationRequest;
use Kirki\Ecommerce\App\Resources\Order\OrderCalculationResource;

use Kirki\Ecommerce\App\Services\VariantService;
use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller that calculates order totals for a draft order without saving it.
 *
 * @since 1.0.0
 */
class OrderCalculationController
{
    /** @var VariantService */
    protected $variant_service;

    /**
     * Create the controller with the variant service.
     *
     * @since 1.0.0
     *
     * @param VariantService $variant_service
     */
    public function __construct(VariantService $variant_service)
    {
        $this->variant_service = $variant_service;
    }

    /**
     * Calculate subtotal, discounts, tax, shipping and grand total for the submitted order details.
     *
     * @since 1.0.0
     *
     * @param OrderCalculationRequest $request
     * @param RecalculateCartAction   $action
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The calculation result, in the store's base currency.
     */
    public function get(OrderCalculationRequest $request, RecalculateCartAction $action)
    {
        $context = $this->prepare_context_dto($request->all());

        return response()->json([
            'data' => OrderCalculationResource::make([
                'result' => $action->execute($context),
                'context' => $context,
            ])
        ]);
    }

    /**
     * Build the calculation context from the flattened request data.
     *
     * Also loads the customer's existing order count when a customer is given.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Calculation request data.
     * @return CalculationContextDTO
     */
    protected function prepare_context_dto($data)
    {
        $context = CalculationContextDTO::from_array([
            'items' => $this->prepare_items($data['items']),
            'shipping_address' => [
                'first_name' => $data['shipping_first_name'],
                'last_name' => $data['shipping_last_name'],
                'email' => $data['shipping_email'],
                'phone' => $data['shipping_phone'],
                'address_line1' => $data['shipping_address_line1'],
                'address_line2' => $data['shipping_address_line2'],
                'city' => $data['shipping_city'],
                'state' => $data['shipping_state'],
                'postal_code' => $data['shipping_postal_code'],
                'country' => $data['shipping_country']
            ],
            'billing_address' => [
                'first_name' => $data['billing_first_name'] ?? null,
                'last_name' => $data['billing_last_name'] ?? null,
                'email' => $data['billing_email'] ?? null,
                'phone' => $data['billing_phone'] ?? null,
                'address_line1' => $data['billing_address_line1'] ?? null,
                'address_line2' => $data['billing_address_line2'] ?? null,
                'city' => $data['billing_city'] ?? null,
                'state' => $data['billing_state'] ?? null,
                'postal_code' => $data['billing_postal_code'] ?? null,
                'country' => $data['billing_country'] ?? null
            ],
            'customer_id' => $data['customer_id'],
            'coupon_codes' => $data['coupon_codes'] ?? [],
            'shipping_method_id' => $data['shipping_method'] ?? null,
            'customer_order_count' => 0,
        ]);

        if ($context->customer_id) {
            $context->customer_order_count = $this->get_order_count($context->customer_id);
        }

        return $context;
    }

    /**
     * Convert the submitted line items into calculation item DTOs, filled from their variants.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>>|null $items Submitted items with `variant_id` and `quantity`.
     * @return \Kirki\Ecommerce\Framework\Collections\Collection Calculation item DTOs keyed like the input.
     */
    protected function prepare_items($items)
    {
        return collection($items ?? [])->map(function ($item, $key) {
            $item_dto = new CalculationItemDTO();
            $item_dto->id = $key;
            $item_dto->variant_id = $item['variant_id'];
            $item_dto->quantity = $item['quantity'];

            $variant = $this->variant_service->find($item_dto->variant_id)->load('product.categories');

            $item_dto->product_id = $variant->product_id;
            $item_dto->base_unit_price = $variant->base_sale_price ?: $variant->base_price;
            $item_dto->base_product_total = $variant->base_price;
            $item_dto->weight = $variant->weight;
            $item_dto->shipping_profile_id = $variant->shipping_profile_id;
            $item_dto->tax_profile_id = $variant->tax_profile_id ?: $variant->product->tax_profile_id;
            $item_dto->product_categories = $variant->product->categories->pluck('id')->to_array() ?? [];

            return $item_dto;
        });
    }

    /**
     * Count a customer's orders, excluding cancelled and refunded ones.
     *
     * @since 1.0.0
     *
     * @param int $customer_id
     * @return int
     */
    protected function get_order_count($customer_id)
    {
        $customer = customer(null, $customer_id);
        // @todo: need to update this with order status which are terminal states
        return $customer->get_customer()->orders()->where_not_in('order_status', [OrderStatus::FAILED_CANCELLED, OrderStatus::REFUNDED])->count();
    }
}
