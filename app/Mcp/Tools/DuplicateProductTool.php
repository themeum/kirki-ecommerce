<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Actions\Product\DuplicateProductAction;
use Kirki\Ecommerce\App\Mcp\Concerns\DescribesProducts;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\ProductService;

use function Kirki\Ecommerce\Framework\app;

/**
 * Copies a product and its variants as a new draft product.
 *
 * @since 1.0.0
 */
class DuplicateProductTool extends StoreWriteTool
{
    use DescribesProducts;

    /** @var bool */
    protected $destructive = false;

    /** @var bool */
    protected $requires_confirmation = false;

    /** @var string */
    protected $description = 'Copy one product and its variants as a new draft product, in one call. The copy is not visible in the shop until the merchant publishes it.';

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
            'product_id' => $schema->integer()->min(1)->description('ID of the product to copy, from the find-products tool.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        return $this->validate_arguments($arguments, ['product_id' => 'required|integer|min:1'], [
            'product_id.required' => __('Send the "product_id", from the find-products tool.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        $product = Product::query()->find((int) $params['product_id']);

        return $product === null ? Response::error(__('The product was not found. Use the find-products tool.', 'kirki-ecommerce')) : $product;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $copy = app()->make(DuplicateProductAction::class)->execute((int) $target->id);

        return [
            'source_product_id' => (int) $target->id,
            'product' => $this->product_summary($this->product_service->find((int) $copy->id)),
        ];
    }
}
