<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Actions\Cart\RecalculateCartAction;
use Kirki\Ecommerce\App\Constants\Order\OrderStatus;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\Http\Requests\Order\OrderCalculationeRequest;
use Kirki\Ecommerce\App\Resources\Order\OrderCalculationResource;

use Kirki\Ecommerce\App\Services\VariantService;
use function Kirki\Ecommerce\App\customer;
use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\response;

class OrderCalculationController
{
    protected $variant_service;

    public function __construct(VariantService $variant_service)
    {
        $this->variant_service = $variant_service;
    }

    public function get(OrderCalculationeRequest $request, RecalculateCartAction $action)
    {
        $context = $this->prepare_context_dto($request->all());

        return response()->json([
            'data' => OrderCalculationResource::make([
                'result' => $action->execute($context),
                'context' => $context,
                'currency_code' => $request->input('currency_code')
            ])
        ]);
    }

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
                'postal_code' => $data['shipping_postcode'],
                'country' => $data['shipping_country']
            ],
            'customer_id' => $data['customer_id'],
            'coupon' => $data['coupon_code'] ?? null,
            'shipping_method_id' => $data['shipping_method'] ?? null,
            'customer_order_count' => 0,
        ]);

        if($context->customer_id){
            $context->customer_order_count = $this->get_order_count($context->customer_id);
        }

        return $context;
    }

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
            $item_dto->weight = $variant->weight;
            $item_dto->shipping_profile_id = $variant->shipping_profile_id;
            $item_dto->tax_profile_id = $variant->tax_profile_id ?: $variant->product->tax_profile_id;
            $item_dto->product_categories = $variant->product->categories->pluck('id')->to_array() ?? [];

            return $item_dto;
        });
    }

    protected function get_order_count($customer_id)
    {
        $customer = customer(null, $customer_id);
        return $customer->get_customer()->orders()->where_not_in('order_status', [OrderStatus::CANCELLED, OrderStatus::REFUNDED])->count();
    }
}
