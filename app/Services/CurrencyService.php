<?php

namespace Kirki\Ecommerce\App\Services;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
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
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Exception;
use Kirki\Ecommerce\App\Constants\OptionKeys;

use function Kirki\Ecommerce\App\settings;
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
     * The other stored rates are recalculated against the new base, and the new base gets a rate of 1, in the same
     * transaction.
     *
     * @since 1.0.0
     *
     * @param string $code Currency code.
     * @return bool True when the currency is the base after the call.
     * @throws NotFoundException When no currency has that code.
     * @throws Exception When the transaction fails; it is rolled back first.
     */
    public function set_base(string $code)
    {
        $currency = Currency::where('code', $code)->first();

        throw_if(!$currency, __('Currency not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        if ($currency->is_base) {
            return true;
        }

        return $this->with_demoted_bases(function () use ($code) {
            return (bool) Currency::where('code', $code)->update(['is_base' => 1, 'exchange_rate' => 1]);
        }, $currency->exchange_rate);
    }

    /**
     * Make the currency with the given code the store's only base currency, creating it when it is not stored yet.
     *
     * A missing currency is created from its bundled definition. Either way the currency ends up active with an
     * exchange rate of 1, and every other base currency is demoted in the same transaction. When the currency was
     * already stored, the other stored rates are recalculated against it; a newly created currency has no previous
     * rate, so the other rates stay unchanged.
     *
     * @since 1.0.0
     *
     * @param string $code ISO 4217 currency code.
     * @return Currency The base currency.
     * @throws NotFoundException When the code is not in the bundled currency list.
     * @throws Exception When the transaction fails; it is rolled back first.
     */
    public function ensure_base(string $code)
    {
        $code = strtoupper($code);
        $definition = $this->find_definition($code);

        throw_if(empty($definition), __('Currency not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $existing_currency = Currency::where('code', $code)->first();

        $this->with_demoted_bases(function () use ($code, $definition) {
            $attributes = [
                'exchange_rate' => 1,
                'is_base' => 1,
                'is_active' => 1,
            ];

            $currency = Currency::where('code', $code)->first();

            if (!empty($currency)) {
                $currency->update($attributes);
                return;
            }

            Currency::create(array_merge($attributes, [
                'code' => $code,
                'name' => $definition['name'],
                'symbol' => $definition['symbol'],
            ]));
        }, $existing_currency->exchange_rate ?? null);

        return Currency::where('code', $code)->first();
    }

    /**
     * Find a currency's definition in the bundled currency list.
     *
     * @since 1.0.0
     *
     * @param string $code ISO 4217 currency code, in any case.
     * @return array<string, mixed>|null Null when the code is not in the list.
     */
    public function find_definition(string $code)
    {
        $code = strtoupper($code);

        return $this->list()->first(function ($currency) use ($code) {
            return strtoupper($currency['code'] ?? '') === $code;
        });
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
     * When any of the items is flagged as base, the existing base currency is demoted in the same transaction, the
     * stored rates are recalculated against the item's rate, and the item is inserted with a rate of 1. The other
     * items are inserted with the rates they carry. When no base currency exists yet and none of the items is flagged
     * as base, the first item becomes the base.
     *
     * @since 1.0.0
     *
     * @param array<int, CreateCurrencyDTO|array<string, mixed>> $items Currency DTOs or attribute arrays.
     * @return bool
     * @throws Exception When a base currency is inserted and the transaction fails; it is rolled back first.
     */
    public function insert(array $items)
    {
        $items_array = collection($items)->map(fn($item) => $item instanceof Arrayable ? $item->to_array() : $item)->all();
        $base_index = array_key_first(array_filter($items_array, fn($item) => !empty($item['is_base'])));

        if (is_null($base_index) && !empty($items_array) && !$this->get_base_currency()) {
            $first_index = array_key_first($items_array);
            $items_array[$first_index]['is_base'] = true;
            $base_index = $first_index;
        }

        if (is_null($base_index)) {
            return Currency::insert($items_array);
        }

        $previous_rate = $items_array[$base_index]['exchange_rate'] ?? null;
        $items_array[$base_index]['exchange_rate'] = 1;

        return $this->with_demoted_bases(function () use ($items_array) {
            return Currency::insert($items_array);
        }, $previous_rate);
    }

    /**
     * Create a new currency.
     *
     * When the currency is flagged as base, the existing base currency is demoted in the same transaction, the
     * stored rates are recalculated against the currency's rate, and the currency is created with a rate of 1.
     *
     * @since 1.0.0
     *
     * @param CreateCurrencyDTO $data Currency data.
     * @return Currency
     * @throws Exception When a base currency is created and the transaction fails; it is rolled back first.
     */
    public function create(CreateCurrencyDTO $data)
    {
        if (!$data->is_base) {
            return Currency::create($data->to_array());
        }

        $previous_rate = $data->exchange_rate;
        $data->exchange_rate = 1;

        return $this->with_demoted_bases(function () use ($data) {
            return Currency::create($data->to_array());
        }, $previous_rate);
    }

    /**
     * Update a currency.
     *
     * Setting the base flag on a currency that is not the base demotes every other currency in the same
     * transaction. Clearing the flag on the current base is ignored, so the store always keeps one base.
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

        $was_base = (bool) $currency->is_base;
        $attributes = $data->to_array();

        if ($was_base) {
            $attributes['is_base'] = true;
        }

        if ($was_base || $data->is_base) {
            $attributes['exchange_rate'] = 1;
        }

        $update = function () use ($currency, $attributes) {
            $is_updated = (bool) $currency->update($attributes);

            throw_if(!$is_updated, __('Currency could not be updated.', 'kirki-ecommerce'), Exception::class, Response::BAD_REQUEST);
        };

        if (!$was_base && $data->is_base) {
            $this->with_demoted_bases($update, $currency->exchange_rate);
        } else {
            $update();
        }

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
     * Demote every base currency, then run the save that makes another currency the base, in one transaction.
     *
     * When a base exists and the new base's previous rate against it is positive, every stored rate is first
     * divided by that rate, so the stored rates are relative to the new base. The save must write the new base
     * with a rate of 1.
     *
     * @since 1.0.0
     *
     * @param callable   $save          Saves the new base currency.
     * @param float|null $previous_rate Rate of the new base against the current base; null when it is not known.
     * @return mixed Whatever the callback returns.
     * @throws Exception When the demotion or the callback fails; the transaction is rolled back first.
     */
    protected function with_demoted_bases(callable $save, $previous_rate = null)
    {
        DB::begin_transaction();

        try {
            if ($previous_rate > 0 && $this->get_base_currency()) {
                $this->rebase_exchange_rates((float) $previous_rate);
            }

            Currency::base()->update(['is_base' => 0]);

            $result = $save();

            DB::commit();

            return $result;
        } catch (Exception $e) {
            DB::rollback();
            throw $e;
        }
    }

    /**
     * Divide every stored exchange rate by the new base's previous rate.
     *
     * @since 1.0.0
     *
     * @param float $previous_rate Rate of the new base against the current base; must be positive.
     * @return void
     */
    protected function rebase_exchange_rates(float $previous_rate)
    {
        foreach (Currency::query()->get() as $currency) {
            Currency::where('id', $currency->id)->update([
                'exchange_rate' => round($currency->exchange_rate / $previous_rate, 6),
            ]);
        }
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

    /**
     * Get the currency preferences.
     * 
     * @since 1.0.0
     * 
     * @return array
     */
    public function get_currency_preferences()
    {
        $currency = settings(OptionKeys::CURRENCY_SETTINGS);

        return [
            'currency_format' => $currency->get('currency_format', 'short'),
            'decimal_separator' => $currency->get('decimal_separator', '.'),
            'thousand_separator' => $currency->get('thousand_separator', ','),
            'currency_position' => $currency->get('currency_position', 'before'),
        ];
    }
}
