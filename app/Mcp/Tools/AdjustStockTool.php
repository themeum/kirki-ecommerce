<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Mcp\Concerns\DescribesProducts;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\VariantService;

/**
 * Adds or removes stock of one variant by an amount, when the stock is still the expected quantity.
 *
 * @since 1.0.0
 */
class AdjustStockTool extends StoreWriteTool
{
    use DescribesProducts;

    /** @var string */
    protected $description = 'Add or remove stock of one variant that tracks inventory, for example after a delivery or a stock count. '
        . 'Send the change as "quantity_change" (negative to remove) and the quantity that the merchant thinks is in stock now as "expected_quantity". '
        . 'The change is refused when the stock is not the expected quantity, so an order placed at the same time is not lost. '
        . 'Call without "confirmation_token" to get a preview and a token, then call again with the same arguments and the token.';

    /** @var VariantService */
    protected $variant_service;

    /**
     * Create the tool with the variant service.
     *
     * @since 1.0.0
     *
     * @param VariantService $variant_service Variant service.
     */
    public function __construct(VariantService $variant_service)
    {
        $this->variant_service = $variant_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return [
            'variant_id' => $schema->integer()->min(1)->description('Variant ID, from the stock-levels or find-products tool.'),
            'quantity_change' => $schema->integer()->description('Units to add, or a negative number of units to remove. Not 0.'),
            'expected_quantity' => $schema->integer()->min(0)->description('Units in stock now, as the merchant knows it.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $params = $this->validate_arguments($arguments, [
            'variant_id' => 'required|integer|min:1',
            'quantity_change' => 'required|integer',
            'expected_quantity' => 'required|integer|min:0',
        ], [
            'variant_id.required' => __('Send the "variant_id", from the stock-levels or find-products tool.', 'kirki-ecommerce'),
            'expected_quantity.required' => __('Send the "expected_quantity": the units in stock now.', 'kirki-ecommerce'),
        ]);

        if ((int) $params['quantity_change'] === 0) {
            $this->reject(['quantity_change' => [__('The "quantity_change" must not be 0.', 'kirki-ecommerce')]]);
        }

        return [
            'variant_id' => (int) $params['variant_id'],
            'quantity_change' => (int) $params['quantity_change'],
            'expected_quantity' => (int) $params['expected_quantity'],
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        $variant = Variant::with('product')->find($params['variant_id']);

        return $variant === null ? Response::error(__('The variant was not found. Use the stock-levels or find-products tool.', 'kirki-ecommerce')) : $variant;
    }

    /**
     * Check the stock rules and show the current and the new quantity.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        if (!$target->track_inventory) {
            $this->reject(['variant_id' => [__('The variant does not track inventory, so it has no stock quantity to change.', 'kirki-ecommerce')]]);
        }

        $current = (int) $target->available_quantity;

        if ($current !== $params['expected_quantity']) {
            /* translators: %d: units in stock now. */
            $this->reject(['expected_quantity' => [sprintf(__('The variant has %d units in stock now, not the "expected_quantity". Check the stock with the merchant.', 'kirki-ecommerce'), $current)]]);
        }

        $new = $current + $params['quantity_change'];

        if ($new < 0) {
            /* translators: %d: units in stock now. */
            $this->reject(['quantity_change' => [sprintf(__('The variant has only %d units in stock, so the stock cannot go below 0.', 'kirki-ecommerce'), $current)]]);
        }

        return [
            'variant_id' => (int) $target->id,
            'product_title' => $target->product === null ? null : $target->product->title,
            'sku' => $target->sku,
            'available_quantity' => ['current' => $current, 'new' => $new],
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        return $this->hash_values([(int) $target->available_quantity, (bool) $target->track_inventory]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        if (!$this->variant_service->adjust_available((int) $target->id, $params['quantity_change'], $params['expected_quantity'])) {
            return Response::error(__('The stock changed after the preview. Call the tool again without "confirmation_token" to get a new preview.', 'kirki-ecommerce'));
        }

        return ['variant' => $this->variant_summary(Variant::query()->find((int) $target->id))];
    }
}
