<?php

namespace Kirki\Ecommerce\App\Services;

use Exception;
use Kirki\Ecommerce\App\Constants\DateTimeFormats;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\Coupon\CouponFilterDTO;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Coupon\CreateCouponDTO;
use Kirki\Ecommerce\App\DTO\Coupon\UpdateCouponDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

use function Kirki\Ecommerce\Framework\user;

class CouponService
{
    /**
     * Relations required to render a single coupon through CouponResource.
     *
     * @var array
     */
    const DETAIL_RELATIONS = [
        'categories',
        'customers',
        'products.media',
        'products.attributes',
        'products.attribute_values',
        'products.variants.attribute_values',
        'products.variants.product',
    ];

    /**
     * Return paginated coupons
     *
     * @param CouponFilterDTO $filters
     * @return Paginator
     */
    public function paginated(CouponFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all coupons
     *
     * @param CouponFilterDTO $filters
     * @return Collection
     */
    public function all(CouponFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a coupon by ID.
     *
     * @param int $id
     * @return Coupon
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $coupon = Coupon::with(static::DETAIL_RELATIONS)->find($id);

        if (!$coupon) {
            throw new NotFoundException(__('Coupon not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $coupon;
    }

    /**
     * Find a coupon by code.
     *
     * @param string $code
     * @return Coupon
     * @throws NotFoundException
     */
    public function find_by_code(string $code)
    {
        $coupon = Coupon::with(['categories', 'products.categories', 'customers'])->where('code', $code)->first();

        if (!$coupon) {
            throw new NotFoundException(__('Coupon not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $coupon;
    }

    /**
     * Create a new coupon (used internally by CreateCouponAction).
     *
     * @param CreateCouponDTO $data
     * @return Coupon
     */
    public function create(CreateCouponDTO $data)
    {
        $attributes = $data->to_array();
        $attributes['created_by'] = user()->get_id();
        $attributes['updated_by'] = user()->get_id();

        if ($attributes['discount_value_type'] === DiscountValueType::FIXED) {
            $attributes['base_discount_amount_fixed'] = $attributes['discount_amount'];
        } else {
            $attributes['discount_amount_percentage'] = $attributes['discount_amount'];
        }

        return Coupon::create($attributes);
    }

    /**
     * Update a coupon (used internally by UpdateCouponAction).
     *
     * @param UpdateCouponDTO $data
     * @throws NotFoundException
     * @return bool
     */
    public function update(UpdateCouponDTO $data)
    {
        $coupon = Coupon::find($data->id);

        if (empty($coupon)) {
            throw new NotFoundException(__('Coupon could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $attributes = $data->except(['id', 'discount_amount', 'category_ids', 'product_ids', 'customer_ids', 'reward_product_ids']);
        $attributes['updated_by'] = user()->get_id();

        if ($data->discount_value_type === DiscountValueType::FIXED) {
            $attributes['base_discount_amount_fixed'] = $data->discount_amount;
        } else {
            $attributes['discount_amount_percentage'] = $data->discount_amount;
        }

        $is_updated = (bool) $coupon->update($attributes);

        if (!$is_updated) {
            throw new NotFoundException(__('Coupon could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $is_updated;
    }

    /**
     * Delete a coupon by ID.
     *
     * @param int $id The ID of the coupon to delete.
     * @return bool True if the coupon was deleted successfully, false otherwise.
     * @throws NotFoundException If the coupon could not be found or deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Coupon::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Coupon could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Delete multiple coupons by their IDs.
     *
     * @param array $ids The IDs of the coupons to delete.
     * @return bool True if the coupons were deleted successfully, false otherwise.
     * @throws NotFoundException If the coupons could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        if (empty($ids)) {
            throw new NotFoundException(__('No coupons selected.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = (bool) Coupon::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Coupons could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return true;
    }

    /**
     * Delete all coupons.
     *
     * @param CouponFilterDTO $filters
     * @return bool True if successfully, false otherwise.
     */
    public function delete_all(CouponFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    protected function list_query(CouponFilterDTO $filters)
    {
        return Coupon::query()
            ->when($filters->search, function (QueryBuilder $query, $search) {
                return $query->where_any(['title', 'code'], 'like', '%' . $search . '%');
            })
            ->when(!empty($filters->method), function (QueryBuilder $query) use ($filters) {
                return $query->where('method', $filters->method);
            })
            ->when(!empty($filters->discount_type), function (QueryBuilder $query) use ($filters) {
                return $query->where('discount_type', $filters->discount_type);
            })
            ->when(isset($filters->is_active), function (QueryBuilder $query) use ($filters) {
                return $query->where('is_active', (int) $filters->is_active);
            })
            ->when(!empty($filters->start_date), function (QueryBuilder $query) use ($filters) {
                return $query->where_date('start_datetime', '>=', $filters->start_date);
            })
            ->when(!empty($filters->end_date), function (QueryBuilder $query) use ($filters) {
                return $query->where_date('end_datetime', '<=', $filters->end_date);
            })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            })
            ->when(!empty($filters->status), function (QueryBuilder $query) use ($filters) {
                return $query->apply_status_filter($filters->status);
            });
    }

    /**
     * Check if a coupon code exists.
     *
     * @param string $code
     * @return bool
     */
    public function is_exists(string $code)
    {
        return Coupon::query()->where('code', $code)->exists();
    }

    public function generate_new_code()
    {
        $now = Date::now();

        $year = $now->format(DateTimeFormats::YEAR_SHORT);
        $month = $now->format(DateTimeFormats::MONTH_SHORT);

        $chars = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z', '0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        $i = 8;

        $code = '';

        for ($i; $i > 0; $i--) {
            if ($i === 3) {
                $code .= $year;
            }

            if ($i === 6) {
                $code .= $month;
            }

            $code .= $chars[array_rand($chars)];
        }

        $is_valid = $this->validate_code($code);

        if (!$is_valid) {
            return $this->generate_new_code();
        }

        return $code;
    }

    /**
     * Check if a coupon code is not already in use then it is valid code.
     *
     * @param string $code
     * @return bool when code is not exists then return true otherwise return false
     */
    public function validate_code(string $code)
    {
        return !$this->is_exists($code);
    }

    /**
     * Update coupon activation state
     * @param int $id
     * @param bool $is_active
     * @return Coupon
     */
    public function change_activation_state(int $id, bool $is_active)
    {
        $coupon = Coupon::with(static::DETAIL_RELATIONS)->find($id);

        if ($is_active && $coupon->is_active) {
            throw new Exception(__('The coupon is already activated', 'kirki-ecommerce'));
        }

        if (!$is_active && !$coupon->is_active) {
            throw new Exception(__('The coupon is already deactivated', 'kirki-ecommerce'));
        }

        $coupon->is_active = $is_active ? 1 : 0;
        $coupon->save();

        return $coupon;
    }
}
