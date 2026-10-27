<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Mcp\Concerns\DescribesProducts;
use Kirki\Ecommerce\App\Mcp\Concerns\HandlesProductText;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\ProductService;

/**
 * Changes the text fields of one product, such as the description and the SEO text.
 *
 * @since 1.0.0
 */
class UpdateProductContentTool extends StoreWriteTool
{
    use DescribesProducts;
    use HandlesProductText;

    /** @var string */
    protected $description = 'Change the text of one product: descriptions, extra information, SEO and social share text, and the ribbon. Fields that are not sent do not change. '
        . 'The title, prices, variants, images and status do not change. Call without "confirmation_token" to get a preview with the current and the new text and a token, '
        . 'then call again with the same arguments and the token.';

    /** @var ProductService */
    protected $product_service;

    /**
     * Create the tool with the product service.
     *
     * @since 1.0.0
     *
     * @param ProductService $product_service Product service.
     */
    public function __construct(ProductService $product_service)
    {
        $this->product_service = $product_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return [
            'product_id' => $schema->integer()->min(1)->description('Product ID, from the find-products tool.'),
        ] + $this->product_text_schema($schema);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $params = $this->validate_arguments($arguments, ['product_id' => 'required|integer|min:1'] + $this->product_text_rules() + $this->product_text_item_rules(), [
            'product_id.required' => __('Send the "product_id", from the find-products tool.', 'kirki-ecommerce'),
        ]);

        $fields = array_intersect_key($arguments, array_flip($this->product_text_fields()));

        if (empty($fields)) {
            /* translators: %s: comma separated field names. */
            $this->reject(['product_id' => [sprintf(__('Send at least one field to change: %s.', 'kirki-ecommerce'), implode(', ', $this->product_text_fields()))]]);
        }

        return ['product_id' => (int) $params['product_id'], 'fields' => $this->sanitize_product_text(array_intersect_key($params, $fields))];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        $product = Product::with('variants')->find($params['product_id']);

        return $product === null ? Response::error(__('The product was not found. Use the find-products tool.', 'kirki-ecommerce')) : $product;
    }

    /**
     * Show the current and the new value of each field.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        $fields = [];

        foreach ($params['fields'] as $field => $value) {
            $fields[$field] = ['current' => $target->{$field}, 'new' => $value];
        }

        return [
            'product_id' => (int) $target->id,
            'title' => $target->title,
            'fields' => $fields,
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        $values = [$target->status];

        foreach (array_keys($params['fields']) as $field) {
            $values[$field] = $target->{$field};
        }

        return $this->hash_values($values);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $product = $this->product_service->update_fields((int) $target->id, $params['fields']);

        return [
            'product' => $this->product_summary($product),
            'fields' => array_intersect_key($product->to_array(), $params['fields']),
        ];
    }
}
