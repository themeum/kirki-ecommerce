<?php

namespace Kirki\Ecommerce\App\Services;

use Exception;
use Kirki\Ecommerce\App\Constants\DateTimeFormats;
use Kirki\Ecommerce\App\DTO\Coupon\CouponFilterDTO;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Repositories\CouponRepository;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Coupon\CreateCouponDTO;
use Kirki\Ecommerce\App\DTO\Coupon\UpdateCouponDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

use function Kirki\Ecommerce\Framework\user;

class CouponService
{
    protected $repository;

    public function __construct(CouponRepository $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Return paginated coupons
     *
     * @param CouponFilterDTO $filters
     * @return Paginator
     */
    public function paginated(CouponFilterDTO $filters)
    {
        return $this->repository->paginate($filters->to_array());
    }

    /**
     * Return all coupons
     *
     * @param CouponFilterDTO $filters
     * @return Collection
     */
    public function all(CouponFilterDTO $filters)
    {
        return $this->repository->all($filters->to_array());
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
        $coupon = $this->repository->find($id);

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
        $coupon = $this->repository->find_by_code($code);

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

        return $this->repository->create($attributes);
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
        $coupon = $this->repository->find($data->id);

        if (empty($coupon)) {
            throw new NotFoundException(__('Coupon could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $attributes = $data->to_array();
        $attributes['updated_by'] = user()->get_id();

        return $this->repository->update($data->id, $attributes);
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
        $coupon = $this->repository->find($id);

        if (empty($coupon)) {
            throw new NotFoundException(__('Coupon could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        $is_deleted = $this->repository->delete($id);

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

        $is_deleted = $this->repository->bulk_delete($ids);

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
        return $this->repository->delete_all($filters->to_array());
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
        return !$this->repository->is_exists($code);
    }

    /**
     * Duplicate a coupon by its ID.
     * 
     * @param int $id
     * @return Coupon
     */
    public function duplicate(int $id)
    {
        $coupon = $this->repository->find($id);

        $data = CreateCouponDTO::from_array($coupon->to_array());
        $data->title = $data->title . ' - Copy';
        $data->code = $this->generate_new_code();

        return $this->create($data);
    }

    /**
     * Update coupon activation state
     * @param int $id
     * @param bool $is_active
     * @return Coupon
     */
    public function change_activation_state(int $id, bool $is_active)
    {
        $coupon = $this->repository->find($id);

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
