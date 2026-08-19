<?php

namespace Kirki\Ecommerce\App\Actions\Product;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Throwable;

use function Kirki\Ecommerce\Framework\collection;

class DuplicateProductAction
{
    protected $product_service;
    protected $create_product_action;

    public function __construct(
        ProductService $product_service,
        CreateProductAction $create_product_action
    ) {
        $this->product_service = $product_service;
        $this->create_product_action = $create_product_action;
    }

    /**
     * Duplicate a product along with its associations and variants.
     *
     * @param int $id
     * @return Product
     * @throws Throwable
     */
    public function execute(int $id)
    {
        $product = $this->product_service->find($id);

        $product_payload = CreateProductDTO::from_array([
            'title' => $product->title . ' - Copy',
            'status' => ProductStatus::DRAFT,
            'ribbon' => $product->ribbon,
            'currency_id' => $product->currency_id,
            'brand_id' => $product->brand_id,
            'short_description' => $product->short_description,
            'description' => $product->description,
            'additional_info' => $product->additional_info,
            'seo_title' => $product->seo_title,
            'seo_description' => $product->seo_description,
            'seo_keywords' => $product->seo_keywords,
            'og_title' => $product->og_title,
            'og_description' => $product->og_description,
            'og_image' => $product->og_image,
            'schema_id' => $product->schema_id,
            'llm_instructions' => $product->llm_instructions,
            'media' => $product->media->pluck('ID')->all(),
            'categories' => $product->categories->pluck('id')->all(),
            'tags' => $product->tags->pluck('id')->all(),
            'collections' => $product->collections->pluck('id')->all(),
            'attributes' => $this->attributes_payload($product),
        ]);

        $variants = $product->variants->map(function (Variant $variant) {
            return $this->prepare_variant_copy($variant);
        })->all();

        return $this->create_product_action->execute($product_payload, $variants);
    }

    /**
     * Build the create payload for one duplicated variant.
     *
     * SKU is cleared because it must be unique and barcode/attribute
     * assignments/pricing are carried over as-is. Stock fields are reset
     * because they represent real, order-linked state that a freshly
     * duplicated variant does not have yet.
     *
     * @param Variant $variant
     * @return CreateVariantDTO
     */
    protected function prepare_variant_copy(Variant $variant)
    {
        $data = CreateVariantDTO::from_array($variant->to_array());

        $data->sku = null;
        $data->available_quantity = 0;
        $data->in_stock = false;
        $data->committed_quantity = 0;
        $data->attribute_values = $variant->attribute_values->pluck('id')->all();

        return $data;
    }

    /**
     * Rebuild the [{id, values}] attribute payload shape expected by
     * CreateProductDTO from the product's loaded attributes/attribute_values
     * relations.
     *
     * @param Product $product
     * @return array
     */
    protected function attributes_payload(Product $product)
    {
        $values_by_attribute = $product->attribute_values->group_by('attribute_id');

        return $product->attributes->map(function ($attribute) use ($values_by_attribute) {
            return [
                'id' => $attribute->id,
                'values' => ($values_by_attribute[$attribute->id] ?? collection())->pluck('id')->all(),
            ];
        })->all();
    }
}
