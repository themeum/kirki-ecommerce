<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\DTO\Product\ProductListFilterDTO;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Repositories\ProductRepository;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Product\UpdateProductDTO;
use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\user;

class ProductService
{
    protected $repository;

    public function __construct(ProductRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Return paginated products
     *
     * @param ProductListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ProductListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all products
     *
     * @param ProductListFilterDTO $filters
     * @return Collection
     */
    public function all(ProductListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
    }

    /**
     * Find a product by ID.
     *
     * @param int $id
     * @return Product
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $product = $this->repository->find($id);

        if (empty($product)) {
            throw new NotFoundException(__('Product not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $product;
    }

    /**
     * Create a new product.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateProductDTO $data
     * @return Product
     */
    public function create(CreateProductDTO $data)
    {
        $data->slug = empty($data->slug) ? $data->title : $data->slug;

        $data_array = $data->all();

        $data_array['created_by'] = user()->get_id();
        $data_array['updated_by'] = user()->get_id();

        $attributes = array_map(function ($attribute) {
            return $attribute['id'];
        }, $data->attributes);

        $attribute_values = array_map(function ($attribute) {
            return $attribute['values'];
        }, $data->attributes);

        $attribute_values = array_unique(array_merge(...$attribute_values));

        $product = $this->repository->create($data_array);

        $product->media()->sync($this->format_ordering($data->media));
        $product->collections()->sync($data->collections);
        $product->categories()->sync($data->categories);
        $product->tags()->sync($data->tags);
        $product->attributes()->sync($this->format_ordering($attributes));
        $product->attribute_values()->sync($this->format_ordering($attribute_values));

        return $product;
    }

    /**
     * Updates a product.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdateProductDTO $data
     * @throws NotFoundException
     * @return Product
     */
    public function update(UpdateProductDTO $data)
    {
        $product = $this->repository->find($data->id);

        if (empty($product)) {
            throw new NotFoundException(__('Product could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $data->slug = empty($data->slug) ? $data->title : $data->slug;

        $data_array = $data->all();
        $data_array['updated_by'] = user()->get_id();

        $is_updated = $this->repository->update($data->id, $data_array);

        if (!$is_updated) {
            throw new NotFoundException(__('Product could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $attributes = array_map(function ($attribute) {
            return $attribute['id'];
        }, $data->attributes);

        $attribute_values = array_map(function ($attribute) {
            return $attribute['values'];
        }, $data->attributes);

        $attribute_values = array_unique(array_merge(...$attribute_values));

        $product = $this->repository->find($data->id);

        $product->media()->sync($this->format_ordering($data->media));
        $product->collections()->sync($data->collections);
        $product->categories()->sync($data->categories);
        $product->tags()->sync($data->tags);
        $product->attributes()->sync($this->format_ordering($attributes));
        $product->attribute_values()->sync($this->format_ordering($attribute_values));

        return $product;
    }

    /**
     * Deletes a product by ID.
     *
     * @param int $id The ID of the product to delete.
     * @return bool True if the product was deleted successfully, false otherwise.
     * @throws NotFoundException If the product could not be found or deleted.
     */
    public function delete(int $id)
    {
        $product = $this->repository->find($id);

        if (empty($product)) {
            throw new NotFoundException(__('Product could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

        if (!$is_deleted) {
            throw new NotFoundException(__('Product could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes multiple products by their IDs.
     *
     * @param array $ids The IDs of the products to delete.
     * @return bool True if the products were deleted successfully, false otherwise.
     * @throws NotFoundException If the products could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        if (empty($ids)) {
            throw new NotFoundException(__('No products selected.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new NotFoundException(__('Products could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes all products.
     *
     * @param ProductListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(ProductListFilterDTO $filters)
    {
        return $this->repository->delete_all($filters->to_array());
    }

    /**
     * Format the ordering of the given IDs.
     *
     * @param array $ids
     * @return array
     */
    protected function format_ordering($ids)
    {
        $ordered_data = [];

        foreach ($ids as $index => $id) {
            $ordered_data[$id] = ['ordering' => $index];
        }

        return $ordered_data;
    }

    /**
     * Get shop page data.
     *
     * @since 1.0.0
     *
     * @param array $filters filters.
     *
     * @return array{
     *      products: Paginator,
     *      filters: array
     * }
     */
    public function shop_page_data(array $filters = [])
    {
        $filters_dto = ProductListFilterDTO::from_array($filters);

        // $filters_dto->limit = 1;
        $filters_dto->page = intval($filters['current_page'] ?? 1);
        $filters_dto->sort_order = null;

        $products = $this->paginated($filters_dto);

        return [
            'products' => $products,
            'filters'  => $filters,
        ];
    }
}
