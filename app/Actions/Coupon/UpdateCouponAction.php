<?php

namespace Kirki\Ecommerce\App\Actions\Coupon;

use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\DTO\Coupon\UpdateCouponDTO;
use Kirki\Ecommerce\Supports\Facades\DB;
use Exception;
use Throwable;

class UpdateCouponAction
{
    protected $coupon_service;

    public function __construct(CouponService $coupon_service)
    {
        $this->coupon_service = $coupon_service;
    }

    /**
     * Update a coupon with its relationships.
     *
     * The coupon and its relationships will be updated in a single transaction.
     * If either the coupon or its relationships cannot be updated, a Throwable will be thrown.
     *
     * @param UpdateCouponDTO $payload
     * @return Coupon
     * @throws Throwable
     */
    public function execute(UpdateCouponDTO $payload)
    {
        DB::begin_transaction();

        try {
            $is_updated = $this->coupon_service->update($payload);

            if (!$is_updated) {
                throw new Exception(__('Coupon could not be updated.', 'kirki-ecommerce'));
            }

            $coupon = $this->coupon_service->find($payload->id);

            $coupon->categories()->sync($payload->category_ids ?? []);

            $product_sync_data = [];

            if (!empty($payload->product_ids)) {
                foreach ($payload->product_ids as $product_id) {
                    $product_sync_data[$product_id] = ['is_reward_item' => 0];
                }
            }

            if (!empty($payload->reward_product_ids)) {
                foreach ($payload->reward_product_ids as $product_id) {
                    $product_sync_data[$product_id] = ['is_reward_item' => 1];
                }
            }

            $coupon->products()->sync($product_sync_data);

            $customer_sync_data = [];

            if (!empty($payload->customer_ids)) {
                foreach ($payload->customer_ids as $customer_id) {
                    $customer_sync_data[$customer_id] = ['is_excluded' => $payload->exclude_customers ? 1 : 0];
                }
            }

            $coupon->customers()->sync($customer_sync_data);

            DB::commit();

            return $this->coupon_service->find($coupon->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }
}
