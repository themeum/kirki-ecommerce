<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationItemDTO;
use Kirki\Ecommerce\App\DTO\Calculation\OrderCalculationInputDTO;
use Kirki\Ecommerce\App\DTO\Calculation\OrderCalculationLineDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderItem;
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
 * For an edit, a line that is already on the order is priced from the values
 * stored on it, and the context carries the terms the order was placed with.
 *
 * @since 1.0.0
 */
class OrderCalculationContextService
{
    /** @var VariantService */
    protected $variant_service;

    /** @var CustomerService */
    protected $customer_service;

    /** @var StoredOrderTermsService */
    protected $stored_terms_service;

    /** @var InventoryService */
    protected $inventory_service;

    /** @var array<int, Variant> Variants loaded by the last build, keyed by variant ID. */
    protected $variants_map = [];

    /**
     * Create the service with the variant, customer and inventory services.
     *
     * @since 1.0.0
     *
     * @param VariantService          $variant_service      Variant lookup.
     * @param CustomerService         $customer_service     Buyer email lookup.
     * @param StoredOrderTermsService $stored_terms_service Reads the terms an edited order keeps.
     * @param InventoryService        $inventory_service    Stock check for a quantity.
     */
    public function __construct(VariantService $variant_service, CustomerService $customer_service, StoredOrderTermsService $stored_terms_service, InventoryService $inventory_service)
    {
        $this->variant_service = $variant_service;
        $this->customer_service = $customer_service;
        $this->stored_terms_service = $stored_terms_service;
        $this->inventory_service = $inventory_service;
    }

    /**
     * Build the calculation context for an order payload.
     *
     * @since 1.0.0
     *
     * @param OrderCalculationInputDTO $input Order payload: items, customer, coupon codes, shipping method and addresses.
     * @param Order|null               $order Order being edited, with its items, taxes and coupons loaded; null for a new order.
     * @return CalculationContextDTO
     * @throws NotFoundException When a variant or its product does not exist.
     * @throws ValidationException When a line is sent twice, a new line is not for sale, or a quantity, per-order limit or stock rule is broken.
     */
    public function build(OrderCalculationInputDTO $input, ?Order $order)
    {
        $context = new CalculationContextDTO();
        $context->order_id = $order ? $order->id : null;
        $context->customer_id = $input->customer_id ?? 0;
        $context->customer_email = $this->customer_service->resolve_buyer_email($context->customer_id, null, $input->customer_email);
        $context->shipping_address = $input->get_address('shipping');
        $context->billing_address = $input->get_address('billing');
        $context->coupon_codes = $input->coupon_codes;
        $context->shipping_method_id = $input->shipping_method;
        $context->items = $this->build_items($input->items, $order);
        $context->stored = $order ? $this->stored_terms_service->build($order, $context) : null;

        return $context;
    }

    /**
     * Build the calculation items for the payload's lines.
     *
     * A line with an `order_item_id` is a line already on the order: it keeps the prices
     * stored on it, and it may be a line whose product was unpublished or deleted. A line
     * with a `variant_id` is a new line: it is priced from the variant as it is now and
     * must be for sale.
     *
     * @since 1.0.0
     *
     * @param array<int|string, OrderCalculationLineDTO> $items Lines with `quantity` and either `order_item_id` or `variant_id`.
     * @param Order|null                                 $order Order being edited, with its items loaded; null for a new order.
     * @return \Kirki\Ecommerce\Framework\Collections\Collection Collection of CalculationItemDTO, keyed like the input.
     * @throws NotFoundException When a variant or its product does not exist.
     * @throws ValidationException When a line is sent twice, a new line is not for sale, or a quantity, per-order limit or stock rule is broken.
     */
    public function build_items(array $items, ?Order $order)
    {
        $this->variants_map = [];

        $order_items_by_id = [];

        foreach ($order ? $order->items : [] as $order_item) {
            $order_items_by_id[$order_item->id] = $order_item;
        }

        $this->validate_lines($items, $order_items_by_id);

        return collection($items)->map(function ($item, $key) use ($order_items_by_id) {
            if (empty($item->order_item_id)) {
                return $this->build_new_item($item, $key);
            }

            return $this->build_existing_item($item, $key, $order_items_by_id[$item->order_item_id]);
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
     * Check that each line is sent once and that a line already on the order belongs to it.
     *
     * @since 1.0.0
     *
     * @param array<int|string, OrderCalculationLineDTO> $items             Lines of the payload.
     * @param array<int, OrderItem>                      $order_items_by_id Lines stored on the edited order, keyed by ID; empty for a new order.
     * @return void
     * @throws ValidationException When a line names neither an order line nor a variant, an order line is unknown or sent twice, or a variant is on more than one line of the order.
     */
    protected function validate_lines(array $items, array $order_items_by_id)
    {
        $order_item_ids = array_filter(array_map(fn($item) => $item->order_item_id, $items));
        $new_variant_ids = array_map(fn($item) => $item->variant_id, array_filter($items, fn($item) => empty($item->order_item_id)));
        $stored_variant_ids = array_filter(array_map(fn($order_item) => $order_item->variant_id, $order_items_by_id));

        $has_line_without_target = !empty(array_filter($items, fn($item) => empty($item->order_item_id) && empty($item->variant_id)));
        $has_repeated_order_line = count(array_unique($order_item_ids)) !== count($order_item_ids);
        $has_unknown_order_line = !empty(array_diff($order_item_ids, array_keys($order_items_by_id)));
        $has_repeated_variant = count(array_unique($new_variant_ids)) !== count($new_variant_ids) || !empty(array_intersect($new_variant_ids, $stored_variant_ids));

        throw_if($has_line_without_target, __('Each line needs an order line or a variant.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);
        throw_if($has_repeated_order_line, __('Each order line can be sent only once.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);
        throw_if($has_unknown_order_line, __('A line does not belong to this order.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);
        throw_if($has_repeated_variant, __('Each variant can be on only one line of an order.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);
    }

    /**
     * Build the calculation item for a line that is new to the order, priced from the variant as it is now.
     *
     * @since 1.0.0
     *
     * @param OrderCalculationLineDTO $item     Payload line with `variant_id` and `quantity`.
     * @param int|string              $line_key Key of the line in the payload.
     * @return CalculationItemDTO
     * @throws NotFoundException When the variant or its product does not exist.
     * @throws ValidationException When the variant is not for sale, or the per-order limit or the stock is exceeded.
     */
    protected function build_new_item(OrderCalculationLineDTO $item, $line_key)
    {
        $variant = $this->variant_service->find($item->variant_id);
        $product = $variant->product;

        /* translators: %s: variant ID */
        throw_if(empty($product), sprintf(__('Product not found for variant: %s', 'kirki-ecommerce'), $variant->id), NotFoundException::class, Response::NOT_FOUND);

        /* translators: %s: variant ID */
        throw_if(!$variant->is_available(), sprintf(__('This item is no longer available: %s', 'kirki-ecommerce'), $variant->id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        /* translators: %s: variant ID */
        throw_if($variant->has_limit_per_order && $variant->max_per_order < $item->quantity, sprintf(__('Max per order limit exceeded for variant: %s', 'kirki-ecommerce'), $variant->id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        /* translators: %s: variant ID */
        throw_if(!$this->inventory_service->has_stock($variant->id, $item->quantity), sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $variant->id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        $product->load_missing('categories');

        $this->variants_map[$variant->id] = $variant;

        $item_dto = new CalculationItemDTO();
        $item_dto->id = $line_key;
        $item_dto->line_key = $line_key;
        $item_dto->variant_id = $variant->id;
        $item_dto->product_id = $product->id;
        $item_dto->quantity = $item->quantity;
        $item_dto->base_unit_price = $variant->base_sale_price ?: $variant->base_price;
        $item_dto->base_product_total = $variant->base_price;
        $item_dto->weight = $variant->weight;
        $item_dto->shipping_profile_id = $variant->shipping_profile_id;
        $item_dto->tax_profile_id = $variant->tax_profile_id ?: $product->tax_profile_id;
        $item_dto->product_categories = $product->categories->pluck('id')->all();

        return $item_dto;
    }

    /**
     * Build the calculation item for a line already on the order, priced from the values stored on it.
     *
     * The variant is read only for what is true now: whether the line is still reachable, and
     * the weight, shipping profile, tax profile and categories that a new shipping or tax quote needs.
     *
     * @since 1.0.0
     *
     * @param OrderCalculationLineDTO $item       Payload line with `order_item_id` and `quantity`.
     * @param int|string              $line_key   Key of the line in the payload.
     * @param OrderItem               $order_item Line as stored on the order.
     * @return CalculationItemDTO
     * @throws ValidationException When the quantity of an unreachable line changes, or an increase is over the per-order limit or the stock.
     */
    protected function build_existing_item(OrderCalculationLineDTO $item, $line_key, OrderItem $order_item)
    {
        $variant = $order_item->variant_id ? $this->variant_service->find_or_null($order_item->variant_id) : null;
        $product = $variant ? $variant->product : null;
        $is_reachable = $variant && $variant->is_available();

        $this->validate_quantity_change($variant, $is_reachable, $order_item->quantity, $item->quantity);

        if ($variant) {
            $this->variants_map[$variant->id] = $variant;
        }

        if ($product) {
            $product->load_missing('categories');
        }

        $item_dto = new CalculationItemDTO();
        $item_dto->id = $line_key;
        $item_dto->line_key = $line_key;
        $item_dto->order_item_id = $order_item->id;
        $item_dto->variant_id = $order_item->variant_id;
        $item_dto->product_id = $order_item->product_id;
        $item_dto->is_reachable = $is_reachable;
        $item_dto->quantity = $item->quantity;
        $item_dto->base_unit_price = $order_item->base_catalog_sale_price;
        $item_dto->base_product_total = $order_item->base_catalog_regular_price;
        $item_dto->weight = $variant ? $variant->weight : $order_item->weight;
        $item_dto->shipping_profile_id = $variant ? $variant->shipping_profile_id : null;
        $item_dto->tax_profile_id = $variant ? ($variant->tax_profile_id ?: $product->tax_profile_id) : null;
        $item_dto->product_categories = $product ? $product->categories->pluck('id')->all() : [];

        return $item_dto;
    }

    /**
     * Check the quantity change of a line already on the order.
     *
     * A line that is not reachable keeps its quantity. An increase must stay within the
     * variant's per-order limit as it is now, and the stock must cover the added quantity.
     * A quantity that is not raised is never refused, so the quantity on the order stays
     * even when the limit was lowered or the variant sold out.
     *
     * @since 1.0.0
     *
     * @param Variant|null $variant         Variant as it is now; null when it was deleted.
     * @param bool         $is_reachable    Whether the line's product can still be bought.
     * @param int          $stored_quantity Quantity stored on the line.
     * @param int          $quantity        Quantity sent.
     * @return void
     * @throws ValidationException When the change is not allowed.
     */
    protected function validate_quantity_change($variant, bool $is_reachable, int $stored_quantity, int $quantity)
    {
        if ($quantity === $stored_quantity) {
            return;
        }

        throw_if(!$is_reachable, __('The quantity of an item that is no longer available cannot be changed.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        /* translators: %s: variant ID */
        throw_if($quantity > $stored_quantity && $variant->has_limit_per_order && $variant->max_per_order < $quantity, sprintf(__('Max per order limit exceeded for variant: %s', 'kirki-ecommerce'), $variant->id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        /* translators: %s: variant ID */
        throw_if($quantity > $stored_quantity && !$this->inventory_service->has_stock($variant->id, $quantity - $stored_quantity), sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $variant->id), ValidationException::class, Response::UNPROCESSABLE_ENTITY);
    }
}
