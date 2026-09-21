<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
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

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Manages product schemas: listing, lookup, creation, updates and deletion.
 *
 * @since 1.0.0
 */
class ProductSchemaService
{
    use HasSortableColumns;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function sortable_columns()
    {
        return [
            'id' => 'id',
            'name' => 'name',
            'is_default' => 'is_default',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get a page of product schemas matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, sorting and pagination filters.
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get all product schemas matching the filters, without pagination.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting filters.
     * @return Collection Collection of ProductSchema.
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a product schema by ID or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $id Product schema ID.
     * @return ProductSchema
     * @throws NotFoundException When the product schema does not exist.
     */
    public function find(int $id)
    {
        $product_schema = ProductSchema::find($id);

        throw_if(!$product_schema, __('Product schema not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $product_schema;
    }

    /**
     * Create a new product schema.
     *
     * @since 1.0.0
     *
     * @param CreateProductSchemaDTO $data Product schema data.
     * @return ProductSchema
     */
    public function create(CreateProductSchemaDTO $data)
    {
        $product_schema = ProductSchema::create($data->to_array());

        return $product_schema;
    }

    /**
     * Update a product schema.
     *
     * @since 1.0.0
     *
     * @param UpdateProductSchemaDTO $data Product schema data, including its ID.
     * @return ProductSchema|null The reloaded product schema.
     * @throws NotFoundException When the product schema does not exist or could not be updated.
     */
    public function update(UpdateProductSchemaDTO $data)
    {
        $product_schema = ProductSchema::find($data->id);

        throw_if(empty($product_schema), __('Product schema could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $is_updated = (bool) $product_schema->update($data->to_array());

        throw_if(!$is_updated, __('Product schema could not be updated.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return ProductSchema::find($data->id);
    }

    /**
     * Delete a product schema by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Product schema ID.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no product schema was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) ProductSchema::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Product schema could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete multiple product schemas by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids IDs of the product schemas to delete.
     * @return bool Always true; failure throws.
     * @throws NotFoundException When no product schema was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) ProductSchema::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Product schemas could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete all product schemas matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search filter selecting the product schemas.
     * @return bool True when rows were deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the filtered and sorted query for the list of product schemas.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting filters.
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        $query = ProductSchema::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where('name', 'like', '%' . $search . '%');
        });

        return $this->apply_sorting($query, $filters);
    }
}
