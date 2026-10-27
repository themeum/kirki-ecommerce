<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Actions\Order\CreateOrderAction;
use Kirki\Ecommerce\App\Concerns\ValidatesAddressFields;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationResultDTO;
use Kirki\Ecommerce\App\DTO\Order\CreateOrderPayloadDTO;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Mcp\Concerns\MasksPersonalData;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\App\Services\InventoryService;
use Kirki\Ecommerce\App\Services\OrderService;

use function Kirki\Ecommerce\Framework\app;

/**
 * Creates a manual order, for example a phone or wholesale order, after a preview of its totals.
 *
 * @since 1.0.0
 */
class CreateManualOrderTool extends StoreWriteTool
{
    use MasksPersonalData;
    use ValidatesAddressFields;

    const MAX_ITEMS = 50;

    const ADDRESS_FIELDS = ['first_name', 'last_name', 'address_line1', 'address_line2', 'city', 'state', 'postal_code', 'country', 'phone', 'email', 'company'];

    /** @var bool */
    protected $open_world = true;

    /** @var array<string, mixed> */
    protected $meta = ['anthropic/requiresUserInteraction' => true];

    /** @var string */
    protected $description = 'Create a manual order, for example a phone or wholesale order, in the store currency. The store checks stock, the shipping method, coupons and tax, the same as the admin order form. '
        . 'The new-order emails go to the customer and the store administrators. Call without "confirmation_token" to get a preview with the totals and a token, then call again with the same arguments and the token.';

    /** @var CustomerService */
    protected $customer_service;

    /** @var InventoryService */
    protected $inventory_service;

    /** @var OrderService */
    protected $order_service;

    /**
     * Create the tool with the order services.
     *
     * @since 1.0.0
     *
     * @param CustomerService  $customer_service  Customer lookup.
     * @param InventoryService $inventory_service Stock checks.
     * @param OrderService     $order_service     Order lookup.
     */
    public function __construct(CustomerService $customer_service, InventoryService $inventory_service, OrderService $order_service)
    {
        $this->customer_service = $customer_service;
        $this->inventory_service = $inventory_service;
        $this->order_service = $order_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        $arguments = [
            'items' => $schema->array()
                ->items($schema->object()->properties([
                    'variant_id' => $schema->integer()->min(1)->description('Variant ID, from the find-products or stock-levels tool.'),
                    'quantity' => $schema->integer()->min(1)->description('Number of units, 1 or more.'),
                ]))
                ->description('Order items, 1 to 50.'),
            'customer_id' => $schema->integer()
                ->min(1)
                ->description('Customer ID, from the find-customers tool. Optional; without it the order is a guest order and "customer_email" is required.'),
            'customer_first_name' => $schema->string()->description('Customer first name.'),
            'customer_last_name' => $schema->string()->description('Customer last name.'),
            'customer_email' => $schema->string()->description('Customer email. Required without "customer_id".'),
            'customer_phone' => $schema->string()->description('Customer phone. Optional.'),
            'shipping_method' => $schema->string()->description('ID of a shipping method for the shipping address, from the tax-and-shipping resource.'),
            'coupon_codes' => $schema->array()->items($schema->string())->description('Coupon codes to apply. Optional.'),
            'payment_provider' => $schema->string()->description('ID of the payment provider, from the checkout-and-payments resource. Optional.'),
            'is_billing_same_as_shipping' => $schema->boolean()->default(true)->description('Use the shipping address as the billing address.'),
        ];

        foreach (['shipping', 'billing'] as $type) {
            foreach (static::ADDRESS_FIELDS as $field) {
                $arguments[$type . '_' . $field] = $schema->string()->description(sprintf('%1$s address: %2$s.', ucfirst($type), str_replace('_', ' ', $field)));
            }
        }

        return $arguments;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $arguments['is_billing_same_as_shipping'] = $arguments['is_billing_same_as_shipping'] ?? true;
        $same_billing = filter_var($arguments['is_billing_same_as_shipping'], FILTER_VALIDATE_BOOLEAN);
        $billing_country = (string) ($arguments['billing_country'] ?? '');
        $billing_required = $same_billing ? 'nullable|string' : 'required|string';

        $params = $this->validate_arguments($arguments, [
            'items' => 'required|array|min:1|max:' . static::MAX_ITEMS,
            'items.*.variant_id' => 'required|integer|min:1',
            'items.*.quantity' => 'required|integer|min:1',
            'customer_id' => 'nullable|integer|min:1',
            'customer_first_name' => 'required|string|max:100',
            'customer_last_name' => 'required|string|max:100',
            'customer_email' => (empty($arguments['customer_id']) ? 'required' : 'nullable') . '|string|email|max:200',
            'customer_phone' => 'nullable|string|max:50',
            'shipping_method' => 'required|string|max:100',
            'coupon_codes' => 'nullable|array',
            'coupon_codes.*' => 'string|max:100',
            'payment_provider' => 'nullable|string|max:100',
            'is_billing_same_as_shipping' => 'required|boolean',
            'shipping_first_name' => 'required|string|max:100',
            'shipping_last_name' => 'required|string|max:100',
            'shipping_address_line1' => 'required|string|max:200',
            'shipping_address_line2' => 'nullable|string|max:200',
            'shipping_city' => 'required|string|max:100',
            'shipping_state' => static::address_field_rule((string) ($arguments['shipping_country'] ?? ''), 'state'),
            'shipping_postal_code' => static::address_field_rule((string) ($arguments['shipping_country'] ?? ''), 'postal_code'),
            'shipping_country' => 'required|string|max:2',
            'shipping_phone' => 'nullable|string|max:50',
            'shipping_email' => 'nullable|string|email|max:200',
            'shipping_company' => 'nullable|string|max:200',
            'billing_first_name' => $billing_required . '|max:100',
            'billing_last_name' => $billing_required . '|max:100',
            'billing_address_line1' => $billing_required . '|max:200',
            'billing_address_line2' => 'nullable|string|max:200',
            'billing_city' => $billing_required . '|max:100',
            'billing_state' => $same_billing ? 'nullable|string' : static::address_field_rule($billing_country, 'state'),
            'billing_postal_code' => $same_billing ? 'nullable|string' : static::address_field_rule($billing_country, 'postal_code'),
            'billing_country' => $billing_required . '|max:2',
            'billing_phone' => 'nullable|string|max:50',
            'billing_email' => 'nullable|string|email|max:200',
            'billing_company' => 'nullable|string|max:200',
        ], [
            /* translators: %d: maximum number of items. */
            'items.max' => sprintf(__('Send at most %d items.', 'kirki-ecommerce'), static::MAX_ITEMS),
        ]);

        $params['is_billing_same_as_shipping'] = $same_billing;

        $this->check_references($params);

        return $params;
    }

    /**
     * Calculate the order, so that the preview and the change use the same totals.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        return $this->create_order()->calculate($this->payload($params));
    }

    /**
     * Show the items, the totals and the emails.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        foreach ($params['items'] as $item) {
            if (!$this->inventory_service->has_stock((int) $item['variant_id'], (int) $item['quantity'])) {
                /* translators: %s: variant ID */
                return Response::error(sprintf(__('Not enough stock for variant: %s', 'kirki-ecommerce'), $item['variant_id']));
            }
        }

        $applied = $this->applied_coupon_codes($target);

        return [
            'customer' => [
                'customer_id' => $params['customer_id'] ?? null,
                'name' => trim($params['customer_first_name'] . ' ' . $params['customer_last_name']),
                'email' => $this->mask_email($params['customer_email'] ?? null),
            ],
            'ship_to' => [
                'city' => $params['shipping_city'],
                'country' => $params['shipping_country'],
            ],
            'shipping_method' => $params['shipping_method'],
            'items' => $this->preview_items($params, $target),
            'coupons_applied' => $applied,
            'coupons_not_applied' => array_values(array_diff(array_map('strval', $params['coupon_codes'] ?? []), $applied)),
            'subtotal' => $this->money($target->base_subtotal),
            'discount_total' => $this->money($target->base_discount_total),
            'shipping_total' => $this->money($target->base_shipping_total),
            'tax_total' => $this->money($target->base_tax_total),
            'total' => $this->money($target->base_total),
            'emails' => [
                ['recipient' => 'customer', 'template' => 'new_order'],
                ['recipient' => 'admin', 'template' => 'new_order'],
            ],
        ];
    }

    /**
     * Hash the totals, the unit prices, the stock and the applied coupons.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        $items = [];

        foreach ($target->items as $variant_id => $item) {
            $variant = Variant::query()->find($variant_id);
            $items[] = [(int) $variant_id, $item->base_unit_price, $item->base_total, $variant === null ? null : [$variant->available_quantity, $variant->in_stock]];
        }

        return $this->hash_values([
            $items,
            $target->base_subtotal,
            $target->base_discount_total,
            $target->base_shipping_total,
            $target->base_tax_total,
            $target->base_total,
            $this->applied_coupon_codes($target),
        ]);
    }

    /**
     * Create the order.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $dto = $this->payload($params);
        $dto->created_by = get_current_user_id() ?: null;

        $order = $this->order_service->find_order_or_fail((int) $this->create_order()->execute($dto)->id);

        return [
            'order' => [
                'order_id' => (int) $order->id,
                'order_number' => $order->order_number,
                'order_status' => $order->order_status,
                'fulfillment_status' => $order->fulfillment_status,
                'payment_status' => $order->payment_status,
                'total' => $this->money($order->base_total),
            ],
        ];
    }

    /**
     * Get the action that creates orders. It is resolved on use, because it needs the base currency.
     *
     * @since 1.0.0
     *
     * @return CreateOrderAction
     */
    protected function create_order()
    {
        return app()->make(CreateOrderAction::class);
    }

    /**
     * Reject a customer or a variant that does not exist.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return void
     */
    protected function check_references(array $params)
    {
        if (!empty($params['customer_id']) && empty($this->customer_service->find((int) $params['customer_id']))) {
            $this->reject(['customer_id' => [__('The customer was not found. Use the find-customers tool, or leave "customer_id" empty for a guest order.', 'kirki-ecommerce')]]);
        }

        $variant_ids = array_map('intval', array_column($params['items'], 'variant_id'));
        $found = Variant::query()->where_in('id', $variant_ids)->get(['id'])->pluck('id')->to_array();
        $missing = array_diff($variant_ids, array_map('intval', $found));

        if (!empty($missing)) {
            /* translators: %s: comma separated variant IDs. */
            $this->reject(['items' => [sprintf(__('These variants were not found: %s. Use the find-products or stock-levels tool.', 'kirki-ecommerce'), implode(', ', $missing))]]);
        }

        if (count($variant_ids) !== count(array_unique($variant_ids))) {
            $this->reject(['items' => [__('Send each variant one time, with the total quantity.', 'kirki-ecommerce')]]);
        }
    }

    /**
     * Build the manual order payload from the arguments.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return CreateOrderPayloadDTO
     */
    protected function payload(array $params)
    {
        $data = [
            'customer_id' => $params['customer_id'] ?? null,
            'items' => array_map(function ($item) {
                return ['variant_id' => (int) $item['variant_id'], 'quantity' => (int) $item['quantity']];
            }, $params['items']),
            'currency_code' => Money::get_base_currency(),
            'payment_provider' => $params['payment_provider'] ?? null,
            'coupon_codes' => $params['coupon_codes'] ?? [],
            'shipping_method' => $params['shipping_method'],
            'is_billing_same_as_shipping' => $params['is_billing_same_as_shipping'],
            'customer_first_name' => $params['customer_first_name'],
            'customer_last_name' => $params['customer_last_name'],
            'customer_email' => $params['customer_email'] ?? null,
            'customer_phone' => $params['customer_phone'] ?? null,
            'is_manual' => true,
        ];

        foreach (['shipping', 'billing'] as $type) {
            foreach (static::ADDRESS_FIELDS as $field) {
                $data[$type . '_' . $field] = $params[$type . '_' . $field] ?? null;
            }
        }

        return CreateOrderPayloadDTO::from_array($data);
    }

    /**
     * Get the preview rows of the items.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     * @param CalculationResultDTO $result Calculated order.
     *
     * @return array<int, array<string, mixed>>
     */
    protected function preview_items(array $params, CalculationResultDTO $result)
    {
        $rows = [];

        foreach ($params['items'] as $item) {
            $variant = Variant::with('product')->find((int) $item['variant_id']);
            $line = $result->items[(int) $item['variant_id']] ?? null;

            $rows[] = [
                'variant_id' => (int) $item['variant_id'],
                'product_title' => $variant === null || $variant->product === null ? null : $variant->product->title,
                'sku' => $variant === null ? null : $variant->sku,
                'quantity' => (int) $item['quantity'],
                'unit_price' => $line === null ? null : $this->money($line->base_unit_price),
                'line_total' => $line === null ? null : $this->money($line->base_total),
            ];
        }

        return $rows;
    }

    /**
     * Get the codes of the coupons that the calculation applied.
     *
     * @since 1.0.0
     *
     * @param CalculationResultDTO $result Calculated order.
     *
     * @return string[]
     */
    protected function applied_coupon_codes(CalculationResultDTO $result)
    {
        $codes = [];

        foreach ($result->coupon_results as $coupon_result) {
            $codes[] = (string) $coupon_result->coupon->code;
        }

        return $codes;
    }
}
