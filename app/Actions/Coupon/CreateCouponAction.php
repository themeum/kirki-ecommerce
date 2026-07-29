<?php

namespace Kirki\Ecommerce\App\Actions\Coupon;

use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\DTO\Coupon\CreateCouponDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Exception;
use Throwable;

class CreateCouponAction
{
    protected $coupon_service;

    public function __construct(CouponService $coupon_service)
    {
        $this->coupon_service = $coupon_service;
    }

    /**
     * Create a new coupon with its relationships.
     *
     * The coupon and its relationships will be created in a single transaction.
     * If either the coupon or its relationships cannot be created, a Throwable will be thrown.
     *
     * @param CreateCouponDTO $payload
     * @return Coupon
     * @throws Throwable
     */
    public function execute(CreateCouponDTO $payload)
    {
        DB::begin_transaction();

        try {
            $coupon = $this->coupon_service->create($payload);

            if (empty($coupon)) {
                throw new Exception(__('Coupon could not be created.', 'kirki-ecommerce'));
            }

            if (!empty($payload->category_ids)) {
                $coupon->categories()->sync($payload->category_ids);
            }

            if (!empty($payload->product_ids)) {
                $product_sync_data = [];

                foreach ($payload->product_ids as $product_id) {
                    $product_sync_data[$product_id] = ['is_reward_item' => 0];
                }

                $coupon->products()->sync($product_sync_data);
            }

            if (!empty($payload->reward_product_ids)) {
                $reward_sync_data = [];

                foreach ($payload->reward_product_ids as $product_id) {
                    $reward_sync_data[$product_id] = ['is_reward_item' => 1];
                }

                $coupon->products()->sync($reward_sync_data);
            }

            if (!empty($payload->customer_ids)) {
                $customer_sync_data = [];

                foreach ($payload->customer_ids as $customer_id) {
                    $customer_sync_data[$customer_id] = ['is_excluded' => $payload->exclude_customers ? 1 : 0];
                }

                $coupon->customers()->sync($customer_sync_data);
            }

            DB::commit();

            return $this->coupon_service->find($coupon->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }
}
