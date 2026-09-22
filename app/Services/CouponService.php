<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
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

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * Manages discount coupons: listing, lookup, CRUD, code generation and usage counters.
 *
 * @since 1.0.0
 */
class CouponService
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
            'title' => 'title',
            'code' => 'code',
            'method' => 'method',
            'discount_type' => 'discount_type',
            'current_usage_count' => 'current_usage_count',
            'start_datetime' => 'start_datetime',
            'end_datetime' => 'end_datetime',
            'usage_limit' => 'usage_limit',
            'is_active' => 'is_active',
            'created_by' => 'created_by',
            'updated_by' => 'updated_by',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

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
    ];

    /**
     * Get a page of coupons matching the filters.
     *
     * @since 1.0.0
     *
     * @param CouponFilterDTO $filters Search, method, discount type, status, date range, sorting and pagination.
     * @return Paginator
     */
    public function paginated(CouponFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get every coupon matching the filters.
     *
     * @since 1.0.0
     *
     * @param CouponFilterDTO $filters Search, method, discount type, status, date range and sorting.
     * @return Collection Collection of Coupon models.
     */
    public function all(CouponFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a coupon, with the relations needed to render it, by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Coupon ID.
     * @return Coupon
     * @throws NotFoundException When the coupon does not exist.
     */
    public function find(int $id)
    {
        $coupon = Coupon::with(static::DETAIL_RELATIONS)->find($id);

        throw_if(!$coupon, __('Coupon not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $coupon;
    }

    /**
     * Find a coupon by its code.
     *
     * @since 1.0.0
     *
     * @param string $code Coupon code.
     * @return Coupon
     * @throws NotFoundException When no coupon has that code.
     */
    public function find_by_code(string $code)
    {
        $coupon = Coupon::with(['categories', 'products.categories', 'customers'])->where('code', $code)->first();

        throw_if(!$coupon, __('Coupon not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $coupon;
    }

    /**
     * Find coupons by code in a single query.
     *
     * Codes that don't resolve to a coupon are silently omitted from the result
     * rather than throwing, so callers resolving several applied-coupon codes at
     * once (e.g. a cart's) don't need to query per code or handle a not-found
     * error per code.
     *
     * @since 1.0.0
     *
     * @param string[] $codes Coupon codes.
     * @return Collection Collection of Coupon models.
     */
    public function find_by_codes(array $codes)
    {
        if (empty($codes)) {
            return collection();
        }

        return Coupon::with(['categories', 'products.categories', 'customers'])->where_in('code', $codes)->get();
    }

    /**
     * Create a new coupon (used internally by CreateCouponAction).
     *
     * Stores the discount amount as a fixed base amount or a percentage,
     * depending on the discount value type.
     *
     * @since 1.0.0
     *
     * @param CreateCouponDTO $data Coupon data.
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
     * Related product, category and customer IDs in the payload are not
     * persisted here.
     *
     * @since 1.0.0
     *
     * @param UpdateCouponDTO $data Coupon data including the ID.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When the coupon does not exist or cannot be updated.
     */
    public function update(UpdateCouponDTO $data)
    {
        $coupon = Coupon::find($data->id);

        throw_if(empty($coupon), __('Coupon could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $attributes = $data->except(['id', 'discount_amount', 'category_ids', 'product_ids', 'customer_ids', 'exclude_customer_ids', 'reward_product_ids']);
        $attributes['updated_by'] = user()->get_id();

        if ($data->discount_value_type === DiscountValueType::FIXED) {
            $attributes['base_discount_amount_fixed'] = $data->discount_amount;
        } else {
            $attributes['discount_amount_percentage'] = $data->discount_amount;
        }

        $is_updated = (bool) $coupon->update($attributes);

        throw_if(!$is_updated, __('Coupon could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $is_updated;
    }

    /**
     * Delete a coupon by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Coupon ID.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When no coupon was deleted.
     */
    public function delete(int $id)
    {
        $is_deleted = (bool) Coupon::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Coupon could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete multiple coupons by their IDs.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Coupon IDs.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When no IDs are given or no coupon was deleted.
     */
    public function bulk_delete(array $ids)
    {
        throw_if(empty($ids), __('No coupons selected.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $is_deleted = (bool) Coupon::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Coupons could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return true;
    }

    /**
     * Delete every coupon matching the filters.
     *
     * @since 1.0.0
     *
     * @param CouponFilterDTO $filters Search, method, discount type, status and date range filters.
     * @return bool True when at least one coupon was deleted.
     */
    public function delete_all(CouponFilterDTO $filters)
    {
        return (bool) $this->list_query($filters)->delete();
    }

    /**
     * Build the coupon list query with filters and sorting applied.
     *
     * @since 1.0.0
     *
     * @param CouponFilterDTO $filters Search, method, discount type, status, date range and sorting.
     * @return QueryBuilder
     */
    protected function list_query(CouponFilterDTO $filters)
    {
        $query = Coupon::query()
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
            ->filter_with_datetime_range($filters->from_date, $filters->to_date)
            ->when(!empty($filters->status), function (QueryBuilder $query) use ($filters) {
                return $query->apply_status_filter($filters->status);
            });

        return $this->apply_sorting($query, $filters);
    }

    /**
     * Check whether a coupon with the given code exists.
     *
     * @since 1.0.0
     *
     * @param string $code Coupon code.
     * @return bool
     */
    public function is_exists(string $code)
    {
        return Coupon::query()->where('code', $code)->exists();
    }

    /**
     * Generate a random, unused coupon code.
     *
     * The code is 8 random letters and digits with the current two-digit year and
     * month embedded in it; generation repeats until the code is unused.
     *
     * @since 1.0.0
     *
     * @return string
     */
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
     * Check whether a coupon code is still available.
     *
     * @since 1.0.0
     *
     * @param string $code Coupon code.
     * @return bool True when no coupon uses the code.
     */
    public function validate_code(string $code)
    {
        return !$this->is_exists($code);
    }

    /**
     * Activate or deactivate a coupon.
     *
     * @since 1.0.0
     *
     * @param int  $id        Coupon ID.
     * @param bool $is_active Desired activation state.
     * @return Coupon The updated coupon with its detail relations.
     * @throws \Exception When the coupon is already in the requested state.
     */
    public function change_activation_state(int $id, bool $is_active)
    {
        $coupon = Coupon::with(static::DETAIL_RELATIONS)->find($id);

        throw_if($is_active && $coupon->is_active, __('The coupon is already activated', 'kirki-ecommerce'));

        throw_if(!$is_active && !$coupon->is_active, __('The coupon is already deactivated', 'kirki-ecommerce'));

        $coupon->is_active = $is_active ? 1 : 0;
        $coupon->save();

        return $coupon;
    }

    /**
     * Increment a numeric coupon column.
     *
     * @since 1.0.0
     *
     * @param int    $id     Coupon ID.
     * @param string $column Column to increment.
     * @param int    $count  Amount to add.
     * @return bool True when a row was updated.
     */
    public function increment(int $id, string $column, int $count = 1)
    {
        return (bool) Coupon::query()->where('id', $id)->increment($column, $count);
    }

    /**
     * Decrement a numeric coupon column.
     *
     * @since 1.0.0
     *
     * @param int    $id     Coupon ID.
     * @param string $column Column to decrement.
     * @param int    $count  Amount to subtract.
     * @return bool True when a row was updated.
     */
    public function decrement(int $id, string $column, int $count = 1)
    {
        return (bool) Coupon::query()->where('id', $id)->decrement($column, $count);
    }
}
