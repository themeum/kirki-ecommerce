<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\Brand\CreateBrandDTO;
use Kirki\Ecommerce\App\DTO\Brand\UpdateBrandDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use Exception;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * Manages product brands: listing, lookup and CRUD.
 *
 * @since 1.0.0
 */
class BrandService
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
            'slug' => 'slug',
            'created_by' => 'created_by',
            'updated_by' => 'updated_by',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
            'count' => 'products_count',
        ];
    }

    /**
     * Get a page of brands, with product counts, matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, sorting and pagination.
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get every brand, with product counts, matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting.
     * @return Collection Collection of Brand models.
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a brand, with its product count, by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Brand ID.
     * @return Brand
     * @throws NotFoundException When the brand does not exist.
     */
    public function find(int $id)
    {
        $brand = Brand::with_count('products')->find($id);

        throw_if(!$brand, __('Brand not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $brand;
    }

    /**
     * Create a new brand.
     *
     * If no slug is provided, it will be generated from the name. The current
     * user is recorded as creator and updater.
     *
     * @since 1.0.0
     *
     * @param CreateBrandDTO $data Brand data.
     * @return Brand
     */
    public function create(CreateBrandDTO $data)
    {
        $data->slug = empty($data->slug) ? $data->name : $data->slug;
        $data->slug = Brand::generate_unique_slug($data->slug);

        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        $brand = Brand::create($attributes);

        return $brand;
    }

    /**
     * Update a brand.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @since 1.0.0
     *
     * @param UpdateBrandDTO $data Brand data including the ID.
     * @return Brand The refreshed brand with its product count.
     * @throws NotFoundException When the brand does not exist.
     * @throws Exception When the update fails.
     */
    public function update(UpdateBrandDTO $data)
    {
        $brand = Brand::find($data->id);

        throw_if(empty($brand), __('Brand could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $data->slug = empty($data->slug) ? $data->name : $data->slug;
        $data->slug = Brand::generate_unique_slug($data->slug, $data->id);

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $is_updated = (bool) $brand->update($attributes);

        throw_if(!$is_updated, __('Brand could not be updated.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return Brand::with_count('products')->find($data->id);
    }

    /**
     * Delete a brand by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Brand ID.
     * @return bool Always true; failure is signalled by an exception.
     * @throws Exception When no brand was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Brand::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Brand could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }

    /**
     * Delete multiple brands by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Brand IDs.
     * @return bool Always true; failure is signalled by an exception.
     * @throws Exception When no brand was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = Brand::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Brands could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }

    /**
     * Delete every brand matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search filter.
     * @return bool|int Number of rows deleted, or false on failure.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->delete();
    }

    /**
     * Build the brand list query with product counts, search and sorting applied.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting.
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        $query = Brand::with_count('products')
            ->when($filters->search, function (QueryBuilder $query, $search) {
                return $query->where_any(['name', 'slug', 'description'], 'like', '%' . $search . '%');
            });

        return $this->apply_sorting($query, $filters);
    }
}
