<?php

namespace Kirki\Ecommerce\App\Actions\Product;

use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Creates a product together with its variants in one transaction.
 *
 * @since 1.0.0
 */
class CreateProductAction
{
    /** @var ProductService */
    protected $product_service;

    /** @var VariantService */
    protected $variant_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param ProductService $product_service Product persistence service.
     * @param VariantService $variant_service Variant persistence service.
     */
    public function __construct(
        ProductService $product_service,
        VariantService $variant_service
    ) {
        $this->product_service = $product_service;
        $this->variant_service = $variant_service;
    }

    /**
     * Create a new product and its variants.
     *
     * The product and its variants will be created in a single transaction.
     * If either the product or its variants cannot be created, a Throwable will be thrown.
     *
     * @since 1.0.0
     *
     * @param CreateProductDTO   $product_payload Product data; has_variants is derived from its attributes.
     * @param CreateVariantDTO[] $variants        Variants to create for the product.
     * @return Product The created product.
     * @throws Throwable When the product or a variant cannot be created; the transaction is rolled back.
     */
    public function execute(CreateProductDTO $product_payload, array $variants)
    {
        DB::begin_transaction();

        try {
            $product_payload->has_variants = count($product_payload->attributes) > 0;

            $product = $this->product_service->create($product_payload);

            throw_if(empty($product), __('Product could not be created.', 'kirki-ecommerce'));

            foreach ($variants as $variant) {
                $variant->product_id = $product->id;
                $variant_model = $this->variant_service->create($variant);

                throw_if(empty($variant_model), __('Product variant could not be created.', 'kirki-ecommerce'));
            }

            DB::commit();

            return $this->product_service->find($product->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }
}
