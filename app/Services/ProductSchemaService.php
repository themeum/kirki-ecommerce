<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\ProductSchema;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\ProductSchema\CreateProductSchemaDTO;
use Kirki\Ecommerce\App\DTO\ProductSchema\UpdateProductSchemaDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

class ProductSchemaService
{
    /**
     * Return paginated product schemas
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all product schemas
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a product schema by ID.
     *
     * @param int $id
     * @return ProductSchema
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $product_schema = ProductSchema::find($id);

        if (!$product_schema) {
            throw new NotFoundException(__('Product schema not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $product_schema;
    }

    /**
     * Create a new product schema.
     *
     * @param CreateProductSchemaDTO $data
     * @return ProductSchema
     */
    public function create(CreateProductSchemaDTO $data)
    {
        $product_schema = ProductSchema::create($data->to_array());

        return $product_schema;
    }

    /**
     * Updates a product schema.
     *
     * @param UpdateProductSchemaDTO $data
     * @throws NotFoundException
     * @return ProductSchema
     */
    public function update(UpdateProductSchemaDTO $data)
    {
        $product_schema = ProductSchema::find($data->id);

        if (empty($product_schema)) {
            throw new NotFoundException(__('Product schema could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_updated = (bool) ProductSchema::find($data->id)->update($data->to_array());

        if (!$is_updated) {
            throw new NotFoundException(__('Product schema could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return ProductSchema::find($data->id);
    }

    /**
     * Deletes a product schema by ID.
     *
     * @param int $id The ID of the product schema to delete.
     * @return bool True if the product schema was deleted successfully, false otherwise.
     * @throws NotFoundException If the product schema could not be found or deleted.
     */
    public function delete(int $id)
    {
        $product_schema = ProductSchema::find($id);

        if (empty($product_schema)) {
            throw new NotFoundException(__('Product schema could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = (bool) ProductSchema::find($id)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Product schema could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes multiple product schemas by their IDs.
     *
     * @param array $ids The IDs of the product schemas to delete.
     * @return bool True if the product schemas were deleted successfully, false otherwise.
     * @throws NotFoundException If the product schemas could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) ProductSchema::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Product schemas could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Deletes all product schemas.
     *
     * @param ListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    protected function list_query(ListFilterDTO $filters)
    {
        return ProductSchema::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where('name', 'like', '%' . $search . '%');
        })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
