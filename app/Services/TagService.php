<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\Tag\CreateTagDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\Tag\UpdateTagDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use Exception;
use Kirki\Ecommerce\App\Supports\ExceptionThrower;
use function Kirki\Ecommerce\Framework\user;

class TagService
{
    /**
     * Return paginated tags
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all tags
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a tag by ID.
     *
     * @param int $id
     * @return Tag
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $tag = Tag::with_count('products')->find($id);

        if (empty($tag)) {
            ExceptionThrower::throw(new NotFoundException(__('Tag not found.', 'kirki-ecommerce'), Response::NOT_FOUND));
        }

        return $tag;
    }

    /**
     * Create a new tag.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateTagDTO $data
     * @return Tag
     */
    public function create(CreateTagDTO $data)
    {
        $data->slug = empty($data->slug) ? $data->name : $data->slug;
        $data->slug = Tag::generate_unique_slug($data->slug);

        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        return Tag::create($attributes);
    }

    /**
     * Updates a tag.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @throws NotFoundException
     * @throws Exception
     * @return Tag
     */
    public function update(UpdateTagDTO $data)
    {
        $tag = Tag::find($data->id);

        if (empty($tag)) {
            ExceptionThrower::throw(new NotFoundException(__('Tag could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND));
        }

        $data->slug = empty($data->slug) ? $data->name : $data->slug;
        $data->slug = Tag::generate_unique_slug($data->slug, $data->id);

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $is_updated = (bool) $tag->update($attributes);

        if (!$is_updated) {
            ExceptionThrower::throw(new Exception(__('Tag could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST));
        }

        return $this->find($data->id);
    }

    /**
     * Deletes a tag by ID.
     *
     * @param int $id The ID of the tag to delete.
     * @return bool True if the tag was deleted successfully, false otherwise.
     * @throws NotFoundException If the tag could not be found or deleted.
     * @throws Exception If the tag could not be deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Tag::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            ExceptionThrower::throw(new Exception(__('Tag could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST));
        }

        return true;
    }

    /**
     * Deletes multiple tags by their IDs.
     *
     * @param array $ids The IDs of the tags to delete.
     * @return bool True if the tags were deleted successfully, false otherwise.
     * @throws Exception If the tags could not be deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) Tag::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            ExceptionThrower::throw(new Exception(__('Tags could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST));
        }

        return true;
    }



    /**
     * Deletes all tags.
     *
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Get the query builder for the list of tags.
     *
     * @param ListFilterDTO $filters
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        return Tag::with_count('products')
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
