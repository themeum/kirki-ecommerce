<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Facades\CurrencyExchange;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Currency\CreateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\Currency\UpdateCurrencyDTO;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;

use Exception;
use function Kirki\Ecommerce\Framework\app;
use function Kirki\Ecommerce\Framework\collection;

class CurrencyService
{
    /**
     * Get base currency
     *
     * @return Currency
     */
    public function get_base_currency()
    {
        return Currency::base()->first();
    }

    /**
     * Set base currency.
     *
     * @param string $code
     * @return bool
     */
    public function set_base(string $code)
    {
        $currency = Currency::where('code', $code)->first();

        if (!$currency) {
            throw new NotFoundException(__('Currency not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        if ($currency->is_base) {
            return true;
        }

        Currency::base()->update(['is_base' => 0]);

        return (bool) Currency::where('code', $code)->update(['is_base' => 1]);
    }

    /**
     * Return all available currencies
     *
     * @return Collection
     */
    public function list()
    {
        return collection($this->get_all_currencies());
    }

    /**
     * Return paginated currencies
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all currencies
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
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
        $currency = Currency::find($id);

        if (!$currency) {
            throw new NotFoundException(__('Currency not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
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
        $currency = Currency::where('code', $code)->first();

        if (!$currency) {
            throw new NotFoundException(__('Currency not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
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

        $currency = Currency::insert($items_array);

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
        $currency = Currency::create($data->to_array());

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
        $currency = Currency::find($data->id);

        if (empty($currency)) {
            throw new NotFoundException(__('Currency could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        if ($currency->code !== $data->code && Currency::where('code', $data->code)->first()) {
            throw new Exception(__('Currency code already exists.', 'kirki-ecommerce'), Response::BAD_REQUEST); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $is_updated = (bool) $currency->update($data->to_array());

        if ($data->is_base && !$currency->is_base) {
            CurrencyExchange::sync();
        }

        if (!$is_updated) {
            throw new Exception(__('Currency could not be updated.', 'kirki-ecommerce'), Response::BAD_REQUEST); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return Currency::find($data->id);
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
        $is_deleted = (bool) Currency::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            throw new Exception(__('Currency could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
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
        $is_deleted = (bool) Currency::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new Exception(__('Currencies could not be deleted.', 'kirki-ecommerce'), Response::BAD_REQUEST); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
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
        return (bool) $this->list_query($filters)->delete();
    }

    protected function list_query(ListFilterDTO $filters)
    {
        return Currency::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where_any(['name', 'code', 'symbol'], 'like', '%' . $search . '%');
        })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }

    protected function get_all_currencies()
    {
        $path = app()->resource_path('data/currencies.json');

        if (!file_exists($path)) {
            return [];
        }

        $content = file_get_contents($path);

        return json_decode($content, true) ?? [];
    }
}
