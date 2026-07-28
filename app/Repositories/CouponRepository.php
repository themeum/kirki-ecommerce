<?php

namespace Kirki\Ecommerce\App\Repositories;

use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Paginator;
use Kirki\Ecommerce\Database\Query\QueryBuilder;

use function Kirki\Ecommerce\dd;

class CouponRepository
{
    /**
     * Get paginated coupons with optional search and sorting.
     *
     * @param array $filters
     * @return Paginator
     */
    public function paginate(array $filters = [])
    {
        return $this->list_query($filters)->paginate($filters['limit'] ?? Pagination::LIMIT, $filters['page'] ?? 1);
    }

    /**
     * Get all coupons with optional search and sorting.
     *
     * @param array $filters
     * @return Collection
     */
    public function all(array $filters = [])
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a coupon by ID.
     *
     * @param int $id
     * @return Coupon|null
     */
    public function find(int $id)
    {
        return Coupon::with(['categories', 'products', 'customers'])->find($id);
    }

    /**
     * Find a coupon by code.
     *
     * @param string $code
     * @return Coupon|null
     */
    public function find_by_code(string $code)
    {
        return Coupon::with(['categories', 'products.categories', 'customers'])->where('code', $code)->first();
    }

    /**
     * Find coupons by codes.
     *
     * @param array $codes
     * @return Collection
     */
    public function find_by_codes(array $codes)
    {
        return Coupon::with(['categories', 'products', 'customers'])->where_in('code', $codes)->get();
    }

    /**
     * Create a new coupon.
     *
     * @param array $data
     * @return Coupon
     */
    public function create(array $data)
    {
        if ($data['discount_value_type'] === DiscountValueType::FIXED) {
            $data['discount_amount_fixed'] = $data['discount_amount'];
        } else {
            $data['discount_amount_percent'] = $data['discount_amount'];
        }

        return Coupon::create($data);
    }

    /**
     * Update a coupon by ID.
     *
     * @param int $id
     * @param array $data
     * @return bool
     */
    public function update(int $id, array $data)
    {
        if ($data['discount_value_type'] === DiscountValueType::FIXED) {
            $data['discount_amount_fixed'] = $data['discount_amount'];
        } else {
            $data['discount_amount_percentage'] = $data['discount_amount'];
        }

        return (bool) Coupon::find($id)->update($data);
    }

    /**
     * Delete a coupon by ID.
     *
     * @param int $id
     * @return bool
     */
    public function delete(int $id)
    {
        return (bool) Coupon::find($id)->delete();
    }

    /**
     * Bulk delete coupons by IDs.
     *
     * @param array $ids
     * @return bool
     */
    public function bulk_delete(array $ids)
    {
        return (bool) Coupon::where_in('id', $ids)->delete();
    }

    /**
     * Delete all coupons.
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
        return Coupon::with(['categories', 'products', 'customers'])
            ->when($filters['search'] ?? null, function (QueryBuilder $query, $search) {
                return $query->where_any(['title', 'code'], 'like', '%' . $search . '%');
            })
            ->when(!empty($filters['method']), function (QueryBuilder $query) use ($filters) {
                if ($filters['method'] === 'all') {
                    return $query;
                }

                return $query->where('method', $filters['method']);
            })
            ->when(!empty($filters['discount_type']), function (QueryBuilder $query) use ($filters) {
                if ($filters['discount_type'] === 'all') {
                    return $query;
                }

                return $query->where('discount_type', $filters['discount_type']);
            })
            ->when(isset($filters['is_active']), function (QueryBuilder $query) use ($filters) {
                return $query->where('is_active', (int) $filters['is_active']);
            })
            ->when(!empty($filters['start_date']), function (QueryBuilder $query) use ($filters) {
                return $query->where_date('start_date', '>=', $filters['start_date']);
            })
            ->when(!empty($filters['end_date']), function (QueryBuilder $query) use ($filters) {
                return $query->where_date('end_date', '<=', $filters['end_date']);
            })
            ->when(!empty($filters['sort_by']) && !empty($filters['sort_order']), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters['sort_by'], $filters['sort_order']);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            })
            ->when(!empty($filters['status']), function (QueryBuilder $query) use ($filters) {
                return $query->apply_status_filter($filters['status']);
            });
    }
}
