<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Mcp\Concerns\DescribesProducts;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\VariantService;

/**
 * Changes the price, sale price or cost of up to 100 variants in one transaction.
 *
 * @since 1.0.0
 */
class UpdatePricesTool extends StoreWriteTool
{
    use DescribesProducts;

    const MAX_VARIANTS = 100;

    const PRICE_FIELDS = ['base_price', 'base_sale_price', 'base_cost_of_goods'];

    /** @var array<string, mixed> */
    protected $meta = ['anthropic/requiresUserInteraction' => true];

    /** @var string */
    protected $description = 'Change "base_price", "base_sale_price" or "base_cost_of_goods" of 1 to 100 variants, for example to start a sale or to apply a supplier price rise. '
        . 'Prices are decimal amounts in the store currency. Send "base_sale_price": null to end a sale. A sale price must not be higher than the price. All variants change together, or none. '
        . 'Call without "confirmation_token" to get a preview with each current and new price and a token, then call again with the same arguments and the token.';

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
            'variants' => $schema->array()
                ->items($schema->object()->properties([
                    'variant_id' => $schema->integer()->min(1)->description('Variant ID, from the find-products or stock-levels tool.'),
                    'base_price' => $schema->number()->min(0)->description('New price.'),
                    'base_sale_price' => $schema->number()->min(0)->nullable()->description('New sale price, or null to end the sale.'),
                    'base_cost_of_goods' => $schema->number()->min(0)->description('New cost of goods.'),
                ]))
                ->description('Variants to change, 1 to 100. Each has "variant_id" and at least one price field.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $this->validate_arguments($arguments, [
            'variants' => 'required|array|min:1|max:' . static::MAX_VARIANTS,
            'variants.*.variant_id' => 'required|integer|min:1',
            'variants.*.base_price' => 'nullable|numeric',
            'variants.*.base_sale_price' => 'nullable|numeric',
            'variants.*.base_cost_of_goods' => 'nullable|numeric',
        ], [
            /* translators: %d: maximum number of variants. */
            'variants.max' => sprintf(__('Send at most %d variants.', 'kirki-ecommerce'), static::MAX_VARIANTS),
        ]);

        $changes = [];

        foreach (array_values($arguments['variants']) as $index => $variant) {
            $prefix = 'variants.' . $index . '.';
            $fields = array_intersect_key($variant, array_flip(static::PRICE_FIELDS));

            if (empty($fields)) {
                $this->reject([$prefix . 'variant_id' => [__('Send at least one of "base_price", "base_sale_price" and "base_cost_of_goods" for each variant.', 'kirki-ecommerce')]]);
            }

            if (isset($fields['base_price']) && $fields['base_price'] === null) {
                $this->reject([$prefix . 'base_price' => [__('The "base_price" cannot be null.', 'kirki-ecommerce')]]);
            }

            $change = ['variant_id' => (int) $variant['variant_id']];

            foreach ($fields as $field => $amount) {
                $change[$field] = $amount === null ? null : $this->to_minor($amount, $prefix . $field);
            }

            $changes[] = $change;
        }

        $ids = array_column($changes, 'variant_id');

        if (count($ids) !== count(array_unique($ids))) {
            $this->reject(['variants' => [__('Send each variant one time.', 'kirki-ecommerce')]]);
        }

        return ['variants' => $changes];
    }

    /**
     * Find the variants, keyed by ID.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        $ids = array_column($params['variants'], 'variant_id');
        $variants = [];

        foreach (Variant::with('product')->where_in('id', $ids)->get()->all() as $variant) {
            $variants[(int) $variant->id] = $variant;
        }

        $missing = array_diff($ids, array_keys($variants));

        if (!empty($missing)) {
            /* translators: %s: comma separated variant IDs. */
            $this->reject(['variants' => [sprintf(__('These variants were not found: %s. Use the find-products or stock-levels tool.', 'kirki-ecommerce'), implode(', ', $missing))]]);
        }

        return $variants;
    }

    /**
     * Check the sale prices and show each current and new price.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        $rows = [];

        foreach ($params['variants'] as $index => $change) {
            $variant = $target[$change['variant_id']];
            $price = array_key_exists('base_price', $change) ? $change['base_price'] : (int) $variant->base_price;
            $sale_price = array_key_exists('base_sale_price', $change) ? $change['base_sale_price'] : $variant->base_sale_price;

            if (!empty($sale_price) && $sale_price > $price) {
                $this->reject(['variants.' . $index . '.base_sale_price' => [__('The sale price cannot be greater than the regular price.', 'kirki-ecommerce')]]);
            }

            $row = [
                'variant_id' => (int) $variant->id,
                'product_title' => $variant->product === null ? null : $variant->product->title,
                'sku' => $variant->sku,
            ];

            foreach (static::PRICE_FIELDS as $field) {
                if (array_key_exists($field, $change)) {
                    $row[$field] = ['current' => $this->money($variant->{$field}), 'new' => $this->money($change[$field])];
                }
            }

            $rows[] = $row;
        }

        return ['variants' => $rows];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        $prices = [];

        foreach ($target as $id => $variant) {
            $prices[$id] = [$variant->base_price, $variant->base_sale_price, $variant->base_cost_of_goods];
        }

        ksort($prices);

        return $this->hash_values($prices);
    }

    /**
     * Change the prices in one transaction.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $rows = array_map(function ($change) {
            $row = $change + ['id' => $change['variant_id']];
            unset($row['variant_id']);

            return $row;
        }, $params['variants']);

        $this->variant_service->bulk_update($rows);

        $variants = [];

        foreach (array_column($params['variants'], 'variant_id') as $id) {
            $variants[] = $this->variant_summary(Variant::query()->find($id));
        }

        return ['variants' => $variants];
    }
}
