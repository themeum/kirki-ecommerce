<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Repositories\CurrencyRepository;
use Kirki\Ecommerce\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Currency\CreateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\Currency\UpdateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Exceptions\NotFoundException;
use Kirki\Ecommerce\Http\Response;

use Exception;
use function Kirki\Ecommerce\collection;

class CurrencyService
{
    protected $repository;

    public function __construct(CurrencyRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Get base currency
     *
     * @return Currency
     */
    public function get_base_currency()
    {
        return $this->repository->find_base();
    }

    /**
     * Set base currency.
     *
     * @param string $code
     * @return bool
     */
    public function set_base(string $code)
    {
        $currency = $this->repository->find_by_code($code);

        if (!$currency) {
            throw new NotFoundException(__('Currency not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        if ($currency->is_base) {
            return true;
        }

        return $this->repository->set_base($code);
    }

    /**
     * Return all available currencies
     *
     * @return Collection
     */
    public function list()
    {
        return $this->repository->list();
    }

    /**
     * Return paginated currencies
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all currencies
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
    }

    /**
     * Find a currency by ID.
     *
     * @param int $id
     * @return Currency
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $currency = $this->repository->find($id);

        if (!$currency) {
            throw new NotFoundException(__('Currency not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $currency;
    }

    /**
     * Find a currency by code.
     *
     * @param string $code
     * @return Currency
     * @throws NotFoundException
     */
    public function find_by_code(string $code)
    {
        $currency = $this->repository->find_by_code($code);

        if (!$currency) {
            throw new NotFoundException(__('Currency not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $currency;
    }

    /**
     * Create a new currency.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateCurrencyDTO[] $items
     * @return mixed
     */
    public function insert(array $items)
    {
        $items_array = collection($items)->map(fn($item) => $item instanceof Arrayable ? $item->to_array() : $item)->all();

        $currency = $this->repository->insert($items_array);

        return $currency;
    }

    /**
     * Create a new currency.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateCurrencyDTO $data
     * @return Currency
     */
    public function create(CreateCurrencyDTO $data)
    {
        $currency = $this->repository->create($data->to_array());

        return $currency;
    }

    /**
     * Updates a currency.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdateCurrencyDTO $data
     * @throws NotFoundException
     * @throws Exception
     * @return Currency
     */
    public function update(UpdateCurrencyDTO $data)
    {
        $currency = $this->repository->find($data->id);

        if (empty($currency)) {
            throw new NotFoundException(__('Currency could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        if ($currency->code !== $data->code && $this->repository->find_by_code($data->code)) {
            throw new Exception(__('Currency code already exists.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        $is_updated = $this->repository->update($data->id, $data->to_array());

        if ($data->is_base && !$currency->is_base) {
            CurrencyExchange::sync();
        }

        if (!$is_updated) {
            throw new Exception(__('Currency could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return $this->repository->find($data->id);
    }

    /**
     * Deletes a currency by ID.
     *
     * @param int $id The ID of the currency to delete.
     * @return bool True if the currency was deleted successfully, false otherwise.
     * @throws NotFoundException If the currency could not be found or deleted.
     * @throws Exception If the currency could not be deleted.
     */
    public function delete(int $id)
    {
        $currency = $this->repository->find($id);

        if (empty($currency)) {
            throw new NotFoundException(__('Currency could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

        if (!$is_deleted) {
            throw new Exception(__('Currency could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return true;
    }

    /**
     * Deletes multiple currencies by their IDs.
     *
     * @param array $ids The IDs of the currencies to delete.
     * @return bool True if the currencies were deleted successfully, false otherwise.
     * @throws Exception If the currencies could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = $this->repository->bulk_delete($ids);

        if (!$is_deleted) {
            throw new Exception(__('Currencies could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST);
        }

        return true;
    }

    /**
     * Deletes all currencies.
     *
     * @param ListFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return $this->repository->delete_all($filters->to_array());
    }
}
