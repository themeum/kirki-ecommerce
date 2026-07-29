<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Collection;
use Kirki\Ecommerce\App\DTO\Collection\CreateCollectionDTO;
use Kirki\Ecommerce\App\DTO\Collection\UpdateCollectionDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\App\Repositories\CollectionRepository;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Collections\Collection as DataCollection;

use Exception;
use function Kirki\Ecommerce\Framework\user;

class CollectionService
{
    /**
     * @var CollectionRepository
     */
    protected $repository;

    public function __construct(CollectionRepository $collection_repository)
    {
        $this->repository = $collection_repository;
    }

    /**
     * Return paginated collections.
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all collections
     *
     * @param ListFilterDTO $filters
     * @return DataCollection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
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
        $collection = $this->repository->find($id);

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

        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        return $this->repository->create($attributes);
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
        $collection = $this->repository->find($data->id);

        if (empty($collection)) {
            throw new NotFoundException(__('Collection could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $data->slug = empty($data->slug) ? $data->title : $data->slug;

        if ($collection->slug !== $data->slug && $this->repository->find_by_slug($data->slug)) {
            throw new Exception(__('Collection slug already exists.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $updated = $this->repository->update($data->id, $attributes);

        if (!$updated) {
            throw new Exception(__('Collection could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return $this->repository->find($data->id);
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
        $deleted = $this->repository->delete($id);

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
        $deleted = $this->repository->bulk_delete($ids);

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
        return $this->repository->delete_all($filters->to_array());
    }
}
