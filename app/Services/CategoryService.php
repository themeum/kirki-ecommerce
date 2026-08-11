<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Category;
use Kirki\Ecommerce\App\Repositories\CategoryRepository;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\Category\CreateCategoryDTO;
use Kirki\Ecommerce\App\DTO\Category\UpdateCategoryDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use Exception;
use function Kirki\Ecommerce\Framework\user;

class CategoryService
{
    protected $repository;

    public function __construct(CategoryRepository $category_repository)
    {
        $this->repository = $category_repository;
    }

    /**
     * Return paginated categories.
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all categories
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
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
        $category = $this->repository->find($id);

        if (empty($category)) {
            throw new NotFoundException(__('Category not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
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
        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        $category = $this->repository->create($attributes);

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
        $category = $this->repository->find($data->id);

        if (empty($category)) {
            throw new NotFoundException(__('Category could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $data->slug = empty($data->slug) ? $data->name : $data->slug;

        if ($category->slug !== $data->slug && $this->repository->find_by_slug($data->slug)) {
            throw new Exception(__('Category slug already exists.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        if ($data->parent_id) {
            $parent_category = Category::find($data->parent_id);

            if ($parent_category) {
                $data->level = $parent_category->level + 1;
            }
        }

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $is_updated = $this->repository->update($data->id, $attributes);

        if (!$is_updated) {
            throw new NotFoundException(__('Category could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return $this->repository->find($data->id);
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
        $category = $this->repository->find($id);

        if (empty($category)) {
            throw new NotFoundException(__('Category could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        if ($category->is_deletable === false) {
            throw new Exception(__('Category is not deletable.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        $is_deleted = $this->repository->delete($id);

        if (!$is_deleted) {
            throw new Exception(__('Category could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
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
        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new Exception(__('Categories could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
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
        return $this->repository->delete_all($filters->to_array());
    }
}
