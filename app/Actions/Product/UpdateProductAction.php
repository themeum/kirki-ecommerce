<?php

namespace Kirki\Ecommerce\App\Actions\Product;

use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\DTO\Product\UpdateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\UpdateVariantDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Updates a product together with its variants in one transaction.
 *
 * @since 1.0.0
 */
class UpdateProductAction
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
     * Update a product and its variants.
     *
     * The product and its variants will be updated in a single transaction.
     * Variants missing from the payload are deleted, variants with an ID are
     * updated, and the rest are created. If the product or any variant cannot
     * be saved, a Throwable will be thrown.
     *
     * @since 1.0.0
     *
     * @param UpdateProductDTO   $product_payload Product data; has_variants is derived from its attributes.
     * @param UpdateVariantDTO[] $variants        The full set of variants the product should end up with.
     * @return Product The updated product.
     * @throws Throwable When the product or a variant cannot be saved; the transaction is rolled back.
     */
    public function execute(UpdateProductDTO $product_payload, array $variants)
    {
        DB::begin_transaction();

        try {
            $product_payload->has_variants = count($product_payload->attributes) > 0;
            $product = $this->product_service->update($product_payload);

            throw_if(empty($product), __('Product could not be updated.', 'kirki-ecommerce'));

            $current_variant_ids = $product->variants->pluck('id')->all();
            $ids_to_delete = array_diff($current_variant_ids, array_filter(array_map(function ($variant) {
                return $variant->id;
            }, $variants)));

            if (!empty($ids_to_delete)) {
                $this->variant_service->bulk_delete($ids_to_delete);
            }

            foreach ($variants as $variant) {
                $variant->product_id = $product->id;

                if (!empty($variant->id)) {
                    $variant_model = $this->variant_service->update($variant);
                } else {
                    $variant_model = $this->variant_service->create(CreateVariantDTO::from_array($variant->all()));
                }

                throw_if(empty($variant_model), __('Product variant could not be updated.', 'kirki-ecommerce'));
            }

            DB::commit();

            return $this->product_service->find($product->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }
}
