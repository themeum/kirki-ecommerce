<?php

namespace Kirki\Ecommerce\App\Services;

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
use function Kirki\Ecommerce\Framework\user;

class BrandService
{
    /**
     * Return paginated brands
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all brands
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a brand by ID.
     *
     * @param int $id
     * @return Brand
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $brand = Brand::with_count('products')->find($id);

        if (!$brand) {
            throw new NotFoundException(__('Brand not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $brand;
    }

    /**
     * Create a new brand.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateBrandDTO $data
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
     * Updates a brand.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdateBrandDTO $data
     * @throws NotFoundException
     * @throws Exception
     * @return Brand
     */
    public function update(UpdateBrandDTO $data)
    {
        $brand = Brand::find($data->id);

        if (empty($brand)) {
            throw new NotFoundException(__('Brand could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $data->slug = empty($data->slug) ? $data->name : $data->slug;

        if ($brand->slug !== $data->slug && Brand::where('slug', $data->slug)->first()) {
            throw new Exception(__('Brand slug already exists.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        $data->slug = Brand::generate_unique_slug($data->slug, $data->id);

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $is_updated = (bool) Brand::query()->where('id', $data->id)->update($attributes);

        if (!$is_updated) {
            throw new Exception(__('Brand could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return Brand::with_count('products')->find($data->id);
    }

    /**
     * Deletes a brand by ID.
     *
     * @param int $id The ID of the brand to delete.
     * @return bool True if the brand was deleted successfully, false otherwise.
     * @throws NotFoundException If the brand could not be found or deleted.
     * @throws Exception If the brand could not be deleted.
     */
    public function delete(int $id)
    {
        $brand = Brand::with_count('products')->find($id);

        if (empty($brand)) {
            throw new NotFoundException(__('Brand could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = (bool) Brand::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            throw new Exception(__('Brand could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return true;
    }

    /**
     * Deletes multiple brands by their IDs.
     *
     * @param array $ids The IDs of the brands to delete.
     * @return bool True if the brands were deleted successfully, false otherwise.
     * @throws Exception If the brands could not be deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) Brand::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new Exception(__('Brands could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return true;
    }

    /**
     * Deletes all brands.
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
        return Brand::with_count('products')
            ->when($filters->search, function (QueryBuilder $query, $search) {
                return $query->where_any(['name', 'slug', 'description'], 'like', '%' . $search . '%');
            })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
