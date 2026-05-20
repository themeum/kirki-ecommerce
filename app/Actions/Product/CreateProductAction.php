<?php

namespace Kirki\Ecommerce\App\Actions\Product;

use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\Supports\Facades\DB;
use Exception;
use Throwable;

class CreateProductAction
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
     * Create a new product and its variants.
     *
     * The product and its variants will be created in a single transaction.
     * If either the product or its variants cannot be created, a Throwable will be thrown.
     *
     * @param CreateProductDTO $product_payload
     * @param CreateVariantDTO[] $variants
     * @return Product
     * @throws Throwable
     */
    public function execute(CreateProductDTO $product_payload, array $variants)
    {
        DB::begin_transaction();

        try {
            $product = $this->product_service->create($product_payload);

            if (empty($product)) {
                throw new Exception(__('Product could not be created.', 'kirki-ecommerce'));
            }

            foreach ($variants as $variant) {
                $variant->product_id = $product->id;
                $variant_model = $this->variant_service->create($variant);

                if (empty($variant_model)) {
                    throw new Exception(__('Product variant could not be created.', 'kirki-ecommerce'));
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
