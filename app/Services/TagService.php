<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
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
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * Manages product tags: listing, lookup, creation, updates and deletion.
 *
 * @since 1.0.0
 */
class TagService
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
     * Get a page of tags matching the filters, with their product counts.
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
     * Get all tags matching the filters, without pagination.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting filters.
     * @return Collection Collection of Tag.
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a tag by ID, with its product count, or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $id Tag ID.
     * @return Tag
     * @throws NotFoundException When the tag does not exist.
     */
    public function find(int $id)
    {
        $tag = Tag::with_count('products')->find($id);

        throw_if(empty($tag), __('Tag not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $tag;
    }

    /**
     * Create a new tag.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @since 1.0.0
     *
     * @param CreateTagDTO $data Tag data.
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
     * Update a tag.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @since 1.0.0
     *
     * @param UpdateTagDTO $data Tag data, including its ID.
     * @return Tag The reloaded tag.
     * @throws NotFoundException When the tag does not exist.
     * @throws Exception         When the tag could not be updated.
     */
    public function update(UpdateTagDTO $data)
    {
        $tag = Tag::find($data->id);

        throw_if(empty($tag), __('Tag could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $data->slug = empty($data->slug) ? $data->name : $data->slug;
        $data->slug = Tag::generate_unique_slug($data->slug, $data->id);

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $is_updated = (bool) $tag->update($attributes);

        throw_if(!$is_updated, __('Tag could not be updated.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return $this->find($data->id);
    }

    /**
     * Delete a tag by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Tag ID.
     * @return bool Always true; failure throws.
     * @throws Exception When no tag was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Tag::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Tag could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }

    /**
     * Delete multiple tags by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids IDs of the tags to delete.
     * @return bool Always true; failure throws.
     * @throws Exception When no tag was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) Tag::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Tags could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }



    /**
     * Delete all tags matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search filter selecting the tags.
     * @return bool True when rows were deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the filtered and sorted query for the list of tags, with product counts.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting filters.
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        $query = Tag::with_count('products')
            ->when($filters->search, function (QueryBuilder $query, $search) {
                return $query->where_any(['name', 'slug', 'description'], 'like', '%' . $search . '%');
            });

        return $this->apply_sorting($query, $filters);
    }
}
