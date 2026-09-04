<?php

namespace Kirki\Ecommerce\App\Actions\Coupon;

use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\DTO\Coupon\CreateCouponDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Throwable;
use Kirki\Ecommerce\App\Supports\ExceptionThrower;

class DuplicateCouponAction
{
    protected $coupon_service;
    protected $create_coupon_action;

    public function __construct(CouponService $coupon_service, CreateCouponAction $create_coupon_action)
    {
        $this->coupon_service = $coupon_service;
        $this->create_coupon_action = $create_coupon_action;
    }

    /**
     * Duplicate a coupon along with its category, product, and customer associations.
     *
     * @param int $id
     * @return Coupon
     * @throws Throwable
     */
    public function execute(int $id)
    {
        $coupon = Coupon::with(['categories', 'products', 'customers'])->find($id);

        if (empty($coupon)) {
            ExceptionThrower::throw(new NotFoundException(__('Coupon could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND));
        }

        $data = CreateCouponDTO::from_array($coupon->to_array());
        $data->title = $data->title . ' - Copy';
        $data->code = $this->coupon_service->generate_new_code();
        $data->discount_amount = $coupon->discount_value_type === DiscountValueType::FIXED
            ? $coupon->base_discount_amount_fixed
            : $coupon->discount_amount_percentage;
        $data->category_ids = $coupon->categories->pluck('id')->to_array();
        $data->customer_ids = $coupon->customers->reject(fn($customer) => !empty($customer->pivot['is_excluded']))->pluck('id')->to_array();
        $data->exclude_customer_ids = $coupon->customers->filter(fn($customer) => !empty($customer->pivot['is_excluded']))->pluck('id')->to_array();
        $data->product_ids = $coupon->products->reject(fn($product) => !empty($product->pivot['is_reward_item']))->pluck('id')->to_array();
        $data->reward_product_ids = $coupon->products->filter(fn($product) => !empty($product->pivot['is_reward_item']))->pluck('id')->to_array();

        return $this->create_coupon_action->execute($data);
    }
}
