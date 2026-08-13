<?php

namespace Kirki\Ecommerce\App\Services;

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
use function Kirki\Ecommerce\Framework\user;

class CollectionService
{
    /**
     * Return paginated collections.
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all collections
     *
     * @param ListFilterDTO $filters
     * @return DataCollection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a collection by ID.
     *
     * @param int $id
     * @return Collection
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $collection = Collection::with_count('products')->find($id);

        if (empty($collection)) {
            throw new NotFoundException(__('Collection not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $collection;
    }

    /**
     * Create a new collection.
     *
     * @param CreateCollectionDTO $data
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
     * @param UpdateCollectionDTO $data
     * @return Collection
     * @throws NotFoundException
     * @throws Exception
     */
    public function update(UpdateCollectionDTO $data)
    {
        $collection = Collection::with_count('products')->find($data->id);

        if (empty($collection)) {
            throw new NotFoundException(__('Collection could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $data->slug = empty($data->slug) ? $data->title : $data->slug;

        if ($collection->slug !== $data->slug && Collection::with_count('products')->where('slug', $data->slug)->first()) {
            throw new Exception(__('Collection slug already exists.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        $data->slug = Collection::generate_unique_slug($data->slug, $data->id);

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $updated = (bool) Collection::find($data->id)->update($attributes);

        if (!$updated) {
            throw new Exception(__('Collection could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return Collection::with_count('products')->find($data->id);
    }

    /**
     * Delete a collection by ID.
     *
     * @param int $id
     * @return bool
     * @throws Exception
     */
    public function delete(int $id)
    {
        $deleted = (bool) Collection::find($id)->delete();

        if (!$deleted) {
            throw new Exception(__('Collection could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return true;
    }

    /**
     * Bulk delete collections.
     *
     * @param array $ids
     * @return bool
     * @throws Exception
     */
    public function bulk_delete(array $ids)
    {
        $deleted = (bool) Collection::where_in('id', $ids)->delete();

        if (!$deleted) {
            throw new Exception(__('Collections could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return true;
    }



    /**
     * Deletes all collections.
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
        return Collection::with_count('products')
            ->when($filters->search, function (QueryBuilder $query, $search) {
                return $query->where_any(['title', 'slug', 'description'], 'like', '%' . $search . '%');
            })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
