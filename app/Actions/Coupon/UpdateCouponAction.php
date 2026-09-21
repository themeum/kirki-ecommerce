<?php

namespace Kirki\Ecommerce\App\Actions\Coupon;

use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\DTO\Coupon\UpdateCouponDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Updates a coupon together with its category, product and customer relationships in one transaction.
 *
 * @since 1.0.0
 */
class UpdateCouponAction
{
    /** @var CouponService */
    protected $coupon_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CouponService $coupon_service Coupon persistence service.
     */
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
     * @since 1.0.0
     *
     * @param UpdateCouponDTO $payload Coupon data with the category, product, reward product and customer ID lists.
     * @return Coupon The updated coupon with its relations loaded.
     * @throws Throwable When the coupon or a relationship cannot be updated; the transaction is rolled back.
     */
    public function execute(UpdateCouponDTO $payload)
    {
        DB::begin_transaction();

        try {
            $is_updated = $this->coupon_service->update($payload);

            throw_if(!$is_updated, __('Coupon could not be updated.', 'kirki-ecommerce'));

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
                    $customer_sync_data[$customer_id] = ['is_excluded' => 0];
                }
            }

            if (!empty($payload->exclude_customer_ids)) {
                foreach ($payload->exclude_customer_ids as $customer_id) {
                    $customer_sync_data[$customer_id] = ['is_excluded' => 1];
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
