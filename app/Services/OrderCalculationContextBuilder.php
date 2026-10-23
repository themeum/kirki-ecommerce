<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Builds the calculation context for an order payload, the same way for the
 * calculation preview, order creation (manual and checkout) and order edits,
 * so a preview and the order saved from the same payload are priced alike.
 *
 * @since 1.0.0
 */
class OrderCalculationContextBuilder
{
    /** @var VariantService */
    protected $variant_service;

    /** @var CustomerService */
    protected $customer_service;

    /** @var array<int, Variant> Variants loaded by the last build, keyed by variant ID. */
    protected $variants_map = [];

    /**
     * Create the builder with the variant and customer services.
     *
     * @since 1.0.0
     *
     * @param VariantService  $variant_service  Variant lookup.
     * @param CustomerService $customer_service Buyer email lookup.
     */
    public function __construct(VariantService $variant_service, CustomerService $customer_service)
    {
        $this->variant_service = $variant_service;
        $this->customer_service = $customer_service;
    }

    /**
     * Build the calculation context for an order payload.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $payload   Order payload: items, customer, coupon codes, shipping method and addresses.
     * @param Order|null           $order     Order being edited, with its items loaded; null for a new order.
     * @param bool                 $is_saving True when the order is being saved, so per-order limits are enforced.
     * @return CalculationContextDTO
     * @throws NotFoundException When a variant or its product does not exist.
     * @throws ValidationException When a variant is sent twice, a new line is not for sale, or a limit is exceeded on save.
     */
    public function build(array $payload, ?Order $order, bool $is_saving)
    {
        $context = new CalculationContextDTO();
        $context->order_id = $order ? $order->id : null;
        $context->customer_id = $payload['customer_id'] ?? 0;
        $context->customer_email = $this->customer_service->resolve_buyer_email($context->customer_id, null, $payload['customer_email'] ?? null);
        $context->shipping_address = $this->prepare_address($payload, 'shipping');
        $context->billing_address = $this->prepare_address($payload, 'billing');
        $context->coupon_codes = $payload['coupon_codes'] ?? [];
        $context->shipping_method_id = $payload['shipping_method'] ?? null;
        $context->items = $this->build_items($payload['items'] ?? [], $order, $is_saving);

        return $context;
    }

    /**
     * Build the calculation items for the payload's lines.
     *
     * A line is existing when the order already has a line for its variant.
     * Only new lines must be for sale; an existing line whose product was
     * unpublished keeps its place on the order.
     *
     * @since 1.0.0
     *
     * @param array<int|string, array<string, mixed>> $items     Lines with `variant_id` and `quantity`.
     * @param Order|null                              $order     Order being edited, with its items loaded; null for a new order.
     * @param bool                                    $is_saving True when the order is being saved, so per-order limits are enforced.
     * @return \Kirki\Ecommerce\Framework\Collections\Collection Collection of CalculationItemDTO, keyed like the input.
     * @throws NotFoundException When a variant or its product does not exist.
     * @throws ValidationException When a variant is sent twice, a new line is not for sale, or a limit is exceeded on save.
     */
    public function build_items(array $items, ?Order $order, bool $is_saving)
    {
        $this->variants_map = [];

        $existing_variant_ids = $order ? $order->items->pluck('variant_id')->filter()->all() : [];

        throw_if(count(array_unique(array_column($items, 'variant_id'))) !== count($items), __('Each variant can be on only one line of an order.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        return collection($items)->map(function ($item, $key) use ($existing_variant_ids, $is_saving) {
            $variant = $this->variant_service->find($item['variant_id']);
            $product = $variant->product;

            /* translators: %s: variant ID */
            throw_if(empty($product), sprintf(__('Product not found for variant: %s', 'kirki-ecommerce'), $variant->id), NotFoundException::class, Response::NOT_FOUND);

            /* translators: %s: variant ID */
            throw_if(!in_array($variant->id, $existing_variant_ids, true) && !$variant->is_available(), sprintf(__('This item is no longer available: %s', 'kirki-ecommerce'), $variant->id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

            /* translators: %s: variant ID */
            throw_if($is_saving && $variant->has_limit_per_order && $variant->max_per_order < $item['quantity'], sprintf(__('Max per order limit exceeded for variant: %s', 'kirki-ecommerce'), $variant->id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

            $product->load_missing('categories');

            $this->variants_map[$variant->id] = $variant;

            $item_dto = new CalculationItemDTO();
            $item_dto->id = $key;
            $item_dto->variant_id = $variant->id;
            $item_dto->product_id = $product->id;
            $item_dto->quantity = $item['quantity'];
            $item_dto->base_unit_price = $variant->base_sale_price ?: $variant->base_price;
            $item_dto->base_product_total = $variant->base_price;
            $item_dto->weight = $variant->weight;
            $item_dto->shipping_profile_id = $variant->shipping_profile_id;
            $item_dto->tax_profile_id = $variant->tax_profile_id ?: $product->tax_profile_id;
            $item_dto->product_categories = $product->categories->pluck('id')->all();

            return $item_dto;
        });
    }

    /**
     * Get the variants loaded by the last build, keyed by variant ID.
     *
     * @since 1.0.0
     *
     * @return array<int, Variant>
     */
    public function get_variants_map()
    {
        return $this->variants_map;
    }

    /**
     * Pick one address out of the flat payload fields with the given prefix.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $payload Order payload.
     * @param string               $type    Address prefix: `shipping` or `billing`.
     * @return array<string, mixed>
     */
    protected function prepare_address(array $payload, string $type)
    {
        $address = [];

        foreach (['first_name', 'last_name', 'email', 'phone', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country'] as $field) {
            $address[$field] = $payload[$type . '_' . $field] ?? null;
        }

        return $address;
    }
}
