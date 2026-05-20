<?php

namespace Kirki\Ecommerce\App\Actions\Product;

use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\DTO\Product\UpdateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\UpdateVariantDTO;
use Kirki\Ecommerce\Supports\Facades\DB;
use Exception;
use Throwable;

class UpdateProductAction
{
    protected $product_service;
    protected $variant_service;

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
     * The product and its variants will be created in a single transaction.
     * If either the product or its variants cannot be created, a Throwable will be thrown.
     *
     * @param UpdateProductDTO $product_payload
     * @param UpdateVariantDTO[] $variants
     * @return Product
     * @throws Throwable
     */
    public function execute(UpdateProductDTO $product_payload, array $variants)
    {
        DB::begin_transaction();

        try {
            $product = $this->product_service->update($product_payload);

            if (empty($product)) {
                throw new Exception(__('Product could not be updated.', 'kirki-ecommerce'));
            }

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

                if (empty($variant_model)) {
                    throw new Exception(__('Product variant could not be updated.', 'kirki-ecommerce'));
                }
            }

            DB::commit();

            return $this->product_service->find($product->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }
}
