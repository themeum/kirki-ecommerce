<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\App\Repositories\BrandRepository;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\App\DTO\Brand\CreateBrandDTO;
use Kirki\Ecommerce\App\DTO\Brand\UpdateBrandDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Exceptions\NotFoundException;
use Kirki\Ecommerce\Http\Response;

use Exception;
use function Kirki\Ecommerce\user;

class BrandService
{
    protected $repository;

    public function __construct(BrandRepository $brand_repository)
    {
        $this->repository = $brand_repository;
    }

    /**
     * Return paginated brands
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all brands
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
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
        $brand = $this->repository->find($id);

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
        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        $brand = $this->repository->create($attributes);

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
        $brand = $this->repository->find($data->id);

        if (empty($brand)) {
            throw new NotFoundException(__('Brand could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $data->slug = empty($data->slug) ? $data->name : $data->slug;

        if ($brand->slug !== $data->slug && $this->repository->find_by_slug($data->slug)) {
            throw new Exception(__('Brand slug already exists.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        $is_updated = $this->repository->update($data->id, $attributes);

        if (!$is_updated) {
            throw new Exception(__('Brand could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return $this->repository->find($data->id);
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
        $brand = $this->repository->find($id);

        if (empty($brand)) {
            throw new NotFoundException(__('Brand could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

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
        $is_deleted = $this->repository->bulk_delete($ids);

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
        return $this->repository->delete_all($filters->to_array());
    }
}
