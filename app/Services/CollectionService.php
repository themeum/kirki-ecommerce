<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Models\Collection;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\Collection\CreateCollectionDTO;
use Kirki\Ecommerce\App\DTO\Collection\UpdateCollectionDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection as DataCollection;

use Exception;

use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * Manages product collections: listing, lookup and CRUD.
 *
 * @since 1.0.0
 */
class CollectionService
{
    use HasSortableColumns;

    /**
     * Relations required to render a single collection through CollectionResource.
     *
     * @var array
     */
    const DETAIL_RELATIONS = [
        'products.media',
        'products.attributes',
        'products.attribute_values',
        'products.variants.attribute_values',
    ];

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
            'title' => 'title',
            'slug' => 'slug',
            'ordering' => 'ordering',
            'created_by' => 'created_by',
            'updated_by' => 'updated_by',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
            'count' => 'products_count',
        ];
    }

    /**
     * Get a page of collections, with product counts, matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, date range, sorting and pagination.
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get every collection, with product counts, matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, date range and sorting.
     * @return DataCollection Collection of Collection models.
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a collection, with its product count, by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Collection ID.
     * @return Collection
     * @throws NotFoundException When the collection does not exist.
     */
    public function find(int $id)
    {
        $collection = Collection::with_count('products')->with(static::DETAIL_RELATIONS)->find($id);

        throw_if(empty($collection), __('Collection not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $collection;
    }

    /**
     * Create a new collection.
     *
     * If no slug is provided, it will be generated from the title. The current
     * user is recorded as creator and updater.
     *
     * @since 1.0.0
     *
     * @param CreateCollectionDTO $data Collection data.
     * @return Collection
     */
    public function create(CreateCollectionDTO $data)
    {
        $data->slug = empty($data->slug) ? $data->title : $data->slug;
        $data->slug = Collection::generate_unique_slug($data->slug);

        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        return Collection::create($attributes);
    }

    /**
     * Update a collection.
     *
     * If no slug is provided, it will be generated from the title.
     *
     * @since 1.0.0
     *
     * @param UpdateCollectionDTO $data Collection data including the ID.
     * @return Collection The refreshed collection with its product count.
     * @throws NotFoundException When the collection does not exist.
     * @throws Exception When the update fails.
     */
    public function update(UpdateCollectionDTO $data)
    {
        $collection = Collection::find($data->id);

        throw_if(empty($collection), __('Collection could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $data->slug = empty($data->slug) ? $data->title : $data->slug;
        $data->slug = Collection::generate_unique_slug($data->slug, $data->id);

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $updated = (bool) $collection->update($attributes);

        throw_if(!$updated, __('Collection could not be updated.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return $this->find($data->id);
    }

    /**
     * Delete a collection by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Collection ID.
     * @return bool Always true; failure is signalled by an exception.
     * @throws Exception When no collection was deleted.
     */
    public function delete(int $id)
    {
        $deleted = (bool) Collection::query()->where('id', $id)->delete();

        throw_if(!$deleted, __('Collection could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }

    /**
     * Delete multiple collections by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Collection IDs.
     * @return bool Always true; failure is signalled by an exception.
     * @throws Exception When no collection was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $deleted = (bool) Collection::where_in('id', $ids)->delete();

        throw_if(!$deleted, __('Collections could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }



    /**
     * Delete every collection matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and date range filters.
     * @return bool True when at least one collection was deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the collection list query with product counts, search, date range and sorting applied.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, date range and sorting.
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        $query = Collection::with_count('products')
            ->when($filters->search, function (QueryBuilder $query, $search) {
                return $query->where_any(['title', 'slug', 'description'], 'like', '%' . $search . '%');
            })
            ->filter_with_datetime_range($filters->from_date, $filters->to_date);

        return $this->apply_sorting($query, $filters);
    }
}
