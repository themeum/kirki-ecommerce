<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;

use function Kirki\Ecommerce\Framework\collection;

class CurrencyRepository
{
    public function list()
    {
        return collection($this->get_all_currencies());
    }
    /**
     * Get paginated currencies with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all currencies with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a currency by ID.
     *
     * @param int $id
     * @return Currency|null
     */
    public function find(int $id)
    {
        return Currency::find($id);
    }

    /**
     * Find a currency by code.
     *
     * @param string $code
     * @return Currency|null
     */
    public function find_by_code(string $code)
    {
        return Currency::where('code', $code)->first();
    }

    /**
     * Find base currency.
     *
     * @return Currency|null
     */
    public function find_base()
    {
        return Currency::base()->first();
    }

    /**
     * Set base currency.
     *
     * @return bool
     */
    public function set_base(string $code)
    {
        Currency::base()->update(['is_base' => 0]);

        return (bool) Currency::where('code', $code)->update(['is_base' => 1]);
    }

    /**
     * Insert multiple currencies.
     *
     * @param array $items
     * @return bool
     */
    public function insert(array $items)
    {
        return Currency::insert($items);
    }

    /**
     * Create a new brand.
     *
     * @param array $data
     * @return Currency
     */
    public function create(array $data)
    {
        return Currency::create($data);
    }

    /**
     * Update a currency by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        return (bool) Currency::find($id)->update($data);
    }

    /**
     * Delete a currency by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) Currency::find($id)->delete();
    }

    /**
     * Bulk delete currencies by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Currency::where_in('id', $ids)->delete();
    }

    /**
     * Delete all currencies.
     *
     * @param array $filters
     * @return bool
     */
    public function delete_all(array $filters = [])
    {
        return (bool) $this->list_query($filters)->delete();
    }

    protected function list_query($filters = [])
    {
        return Currency::when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
            return $query->where_any(['name', 'code', 'symbol'], 'like', '%' . $search . '%');
        })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }

    protected function get_all_currencies()
    {
        $path = KIRKI_ECOMMERCE_PLUGIN_PATH . '/resources/data/currencies.json';

        if (!file_exists($path)) {
            return [];
        }

        $content = file_get_contents($path);

        return json_decode($content, true) ?? [];
    }
}
