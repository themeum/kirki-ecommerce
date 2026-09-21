<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
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
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Manages currencies: listing, lookup, CRUD and base currency selection.
 *
 * @since 1.0.0
 */
class CurrencyService
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
            'code' => 'code',
            'name' => 'name',
            'symbol' => 'symbol',
            'exchange_rate' => 'exchange_rate',
            'is_base' => 'is_base',
            'is_active' => 'is_active',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get the store's base currency.
     *
     * @since 1.0.0
     *
     * @return Currency|null Null when no currency is marked as base.
     */
    public function get_base_currency()
    {
        return Currency::base()->first();
    }

    /**
     * Get currency symbols keyed by currency code (uppercase).
     *
     * @since 1.0.0
     *
     * @return array<string, string>
     */
    public function get_symbol_map()
    {
        return array_change_key_case(
            Currency::query()->pluck('symbol', 'code')->all(),
            CASE_UPPER
        );
    }

    /**
     * Make the currency with the given code the base currency.
     *
     * @since 1.0.0
     *
     * @param string $code Currency code.
     * @return bool True when the currency is the base after the call.
     * @throws NotFoundException When no currency has that code.
     */
    public function set_base(string $code)
    {
        $currency = Currency::where('code', $code)->first();

        throw_if(!$currency, __('Currency not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        if ($currency->is_base) {
            return true;
        }

        Currency::base()->update(['is_base' => 0]);

        return (bool) Currency::where('code', $code)->update(['is_base' => 1]);
    }

    /**
     * Get the bundled list of all known currencies from the currencies data file.
     *
     * @since 1.0.0
     *
     * @return Collection Collection of currency definitions; empty when the data file is missing.
     */
    public function list()
    {
        return collection($this->get_all_currencies());
    }

    /**
     * Get a page of stored currencies matching the filters, base currency first.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, sorting and pagination.
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get every stored currency matching the filters, base currency first.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting.
     * @return Collection Collection of Currency models.
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a currency by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Currency ID.
     * @return Currency
     * @throws NotFoundException When the currency does not exist.
     */
    public function find(int $id)
    {
        $currency = Currency::find($id);

        throw_if(!$currency, __('Currency not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $currency;
    }

    /**
     * Find a currency by its code.
     *
     * @since 1.0.0
     *
     * @param string $code Currency code.
     * @return Currency
     * @throws NotFoundException When no currency has that code.
     */
    public function find_by_code(string $code)
    {
        $currency = Currency::where('code', $code)->first();

        throw_if(!$currency, __('Currency not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $currency;
    }

    /**
     * Insert several currencies in a single query.
     *
     * @since 1.0.0
     *
     * @param array<int, CreateCurrencyDTO|array<string, mixed>> $items Currency DTOs or attribute arrays.
     * @return bool
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
     * @since 1.0.0
     *
     * @param CreateCurrencyDTO $data Currency data.
     * @return Currency
     */
    public function create(CreateCurrencyDTO $data)
    {
        $currency = Currency::create($data->to_array());

        return $currency;
    }

    /**
     * Update a currency.
     *
     * @since 1.0.0
     *
     * @param UpdateCurrencyDTO $data Currency data including the ID.
     * @return Currency The refreshed currency.
     * @throws NotFoundException When the currency does not exist.
     * @throws Exception When the new code is already used by another currency, or the update fails.
     */
    public function update(UpdateCurrencyDTO $data)
    {
        $currency = Currency::find($data->id);

        throw_if(empty($currency), __('Currency could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        throw_if($currency->code !== $data->code && Currency::where('code', $data->code)->first(), __('Currency code already exists.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        $is_updated = (bool) $currency->update($data->to_array());

        if ($data->is_base && !$currency->is_base) {
            CurrencyExchange::sync();
        }

        throw_if(!$is_updated, __('Currency could not be updated.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return Currency::find($data->id);
    }

    /**
     * Delete a currency by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Currency ID.
     * @return bool Always true; failure is signalled by an exception.
     * @throws Exception When no currency was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Currency::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Currency could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }

    /**
     * Delete multiple currencies by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Currency IDs.
     * @return bool Always true; failure is signalled by an exception.
     * @throws Exception When no currency was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $is_deleted = (bool) Currency::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Currencies could not be deleted.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);

        return true;
    }

    /**
     * Delete every currency matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search filter.
     * @return bool True when at least one currency was deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the currency list query with search applied, base currency first, then sorting.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search and sorting.
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        $query = Currency::when($filters->search, function (QueryBuilder $query, $search) {
            return $query->where_any(['name', 'code', 'symbol'], 'like', '%' . $search . '%');
        })->order_by('is_base', 'desc');

        return $this->apply_sorting($query, $filters);
    }

    /**
     * Read the currency definitions from the bundled currencies data file.
     *
     * @since 1.0.0
     *
     * @return array Decoded definitions; empty when the file is missing or invalid.
     */
    protected function get_all_currencies()
    {
        $path = app()->resource_path('data/currencies.json');

        if (!file_exists($path)) {
            return [];
        }

        $content = file_get_contents($path);

        return json_decode($content, true) ?? [];
    }

    /**
     * Get the active currencies from the database.
     *
     * @since 1.0.0
     *
     * @return Collection Collection of Currency models.
     */
    public function get_active_currencies()
    {
        return Currency::where('is_active', 1)->get();
    }
}
