<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Tag;
use Kirki\Ecommerce\App\Repositories\TagRepository;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\Tag\CreateTagDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\DTO\Tag\UpdateTagDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use Exception;
use function Kirki\Ecommerce\Framework\user;

class TagService
{
    protected $repository;

    public function __construct(TagRepository $tag_repository)
    {
        $this->repository = $tag_repository;
    }

    /**
     * Return paginated tags
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all tags
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
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
        $tag = $this->repository->find($id);

        if (empty($tag)) {
            throw new NotFoundException(__('Tag not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
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

        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        return $this->repository->create($attributes);
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
        $tag = $this->repository->find($data->id);

        if (empty($tag)) {
            throw new NotFoundException(__('Tag could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $data->slug = empty($data->slug) ? $data->name : $data->slug;

        if ($tag->slug !== $data->slug && $this->repository->find_by_slug($data->slug)) {
            throw new Exception(__('Tag slug already exists.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $is_updated = $this->repository->update($data->id, $attributes);

        if (!$is_updated) {
            throw new Exception(__('Tag could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST);
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
        $tag = $this->repository->find($id);

        if (empty($tag)) {
            throw new NotFoundException(__('Tag could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

        if (!$is_deleted) {
            throw new Exception(__('Tag could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
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
        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new Exception(__('Tags could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
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
        return $this->repository->delete_all($filters->to_array());
    }
}
