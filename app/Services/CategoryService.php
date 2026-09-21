<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
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
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * Manages product categories: listing, lookup and CRUD.
 *
 * @since 1.0.0
 */
class CategoryService
{
    use HasSortableColumns;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function default_sort_by()
    {
        return 'ordering';
    }

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
            'parent_id' => 'parent_id',
            'ordering' => 'ordering',
            'created_by' => 'created_by',
            'updated_by' => 'updated_by',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
            'count' => 'products_count',
        ];
    }

    /**
     * Get a page of categories, with product counts, matching the filters.
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
     * Get every category, with product counts, matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting.
     * @return Collection Collection of Category models.
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a category, with its product count, by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Category ID.
     * @return Category
     * @throws NotFoundException When the category does not exist.
     */
    public function find(int $id)
    {
        $category = Category::with_count('products')->find($id);

        throw_if(empty($category), __('Category not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $category;
    }

    /**
     * Create a new category.
     *
     * If no slug is provided, it will be generated from the name. The level is
     * derived from the parent, and is_active and is_deletable default to on.
     *
     * @since 1.0.0
     *
     * @param CreateCategoryDTO $data Category data.
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
     * Update a category.
     *
     * If no slug is provided, it will be generated from the name. The level is
     * re-derived from the parent.
     *
     * @since 1.0.0
     *
     * @param UpdateCategoryDTO $data Category data including the ID.
     * @return Category The refreshed category with its product count.
     * @throws NotFoundException When the category does not exist or cannot be updated.
     */
    public function update(UpdateCategoryDTO $data)
    {
        $category = Category::find($data->id);

        throw_if(empty($category), __('Category could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

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

        throw_if(!$is_updated, __('Category could not be updated.', 'kirki-ecommerce'), NotFoundException::class, Response::BAD_REQUEST);

        return Category::with_count('products')->find($data->id);
    }

    /**
     * Delete a category by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Category ID.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When the category does not exist.
     * @throws Exception When the category is not deletable or the delete fails.
     */
    public function delete(int $id)
    {
        $category = Category::find($id);

        throw_if(empty($category), __('Category could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        throw_if($category->is_deletable === false, __('Category is not deletable.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        $is_deleted = (bool) Category::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Category could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }

    /**
     * Delete multiple categories by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Category IDs.
     * @return bool Always true; failure is signalled by an exception.
     * @throws Exception When no category was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) Category::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Categories could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }



    /**
     * Delete every category matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search filter.
     * @return bool True when at least one category was deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the category list query with product counts, search and sorting applied.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting.
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        $query = Category::with_count('products')
            ->when($filters->search, function (QueryBuilder $query, $search) {
                return $query->where_any(['name', 'slug', 'description'], 'like', '%' . $search . '%');
            });

        return $this->apply_sorting($query, $filters);
    }
}
