<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\Category\CreateCategoryDTO;
use Kirki\Ecommerce\App\DTO\Category\UpdateCategoryDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use Exception;
use Kirki\Ecommerce\App\Supports\ExceptionThrower;
use function Kirki\Ecommerce\Framework\user;

class CategoryService
{
    /**
     * Return paginated categories.
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all categories
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a category by ID.
     *
     * @param int $id
     * @return Category
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $category = Category::with_count('products')->find($id);

        if (empty($category)) {
            ExceptionThrower::throw(new NotFoundException(__('Category not found.', 'kirki-ecommerce'), Response::NOT_FOUND));
        }

        return $category;
    }

    /**
     * Create a new category.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateCategoryDTO $data
     * @return Category
     */
    public function create(CreateCategoryDTO $data)
    {
        $data->slug = empty($data->slug) ? $data->name : $data->slug;

        if ($data->parent_id) {
            $parent_category = Category::find($data->parent_id);

            if ($parent_category) {
                $data->level = $parent_category->level + 1;
            }
        }

        $data->is_active = $data->is_active ?? 1;
        $data->is_deletable = $data->is_deletable ?? 1;
        $data->slug = Category::generate_unique_slug($data->slug);

        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        $category = Category::create($attributes);

        return $category;
    }

    /**
     * Updates a category.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdateCategoryDTO $data
     * @throws NotFoundException
     * @throws Exception
     * @return Category
     */
    public function update(UpdateCategoryDTO $data)
    {
        $category = Category::find($data->id);

        if (empty($category)) {
            ExceptionThrower::throw(new NotFoundException(__('Category could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND));
        }

        $data->slug = empty($data->slug) ? $data->name : $data->slug;

        if ($data->parent_id) {
            $parent_category = Category::find($data->parent_id);

            if ($parent_category) {
                $data->level = $parent_category->level + 1;
            }
        }

        $data->slug = Category::generate_unique_slug($data->slug, $data->id);

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $is_updated = (bool) $category->update($attributes);

        if (!$is_updated) {
            ExceptionThrower::throw(new NotFoundException(__('Category could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST));
        }

        return Category::with_count('products')->find($data->id);
    }

    /**
     * Deletes a category by ID.
     *
     * @param int $id The ID of the category to delete.
     * @return bool True if the category was deleted successfully, false otherwise.
     * @throws NotFoundException If the category could not be found or deleted.
     */
    public function delete(int $id)
    {
        $category = Category::find($id);

        if (empty($category)) {
            ExceptionThrower::throw(new NotFoundException(__('Category could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND));
        }

        if ($category->is_deletable === false) {
            ExceptionThrower::throw(new Exception(__('Category is not deletable.', 'kirki-ecommerce'), Response::BAD_REQUEST));
        }

        $is_deleted = (bool) Category::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            ExceptionThrower::throw(new Exception(__('Category could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST));
        }

        return true;
    }

    /**
     * Deletes multiple categories by their IDs.
     *
     * @param array $ids The IDs of the categories to delete.
     * @return bool True if the categories were deleted successfully, false otherwise.
     * @throws Exception If the categories could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) Category::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            ExceptionThrower::throw(new Exception(__('Categories could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST));
        }

        return true;
    }



    /**
     * Deletes all categories.
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
        return Category::with_count('products')
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
