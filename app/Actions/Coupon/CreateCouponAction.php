<?php

namespace Kirki\Ecommerce\App\Actions\Coupon;

use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\DTO\Coupon\CreateCouponDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Creates a coupon together with its category, product and customer relationships in one transaction.
 *
 * @since 1.0.0
 */
class CreateCouponAction
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
     * Create a new coupon with its relationships.
     *
     * The coupon and its relationships will be created in a single transaction.
     * If either the coupon or its relationships cannot be created, a Throwable will be thrown.
     *
     * @since 1.0.0
     *
     * @param CreateCouponDTO $payload Coupon data with the category, product, reward product and customer ID lists.
     * @return Coupon The created coupon with its relations loaded.
     * @throws Throwable When the coupon or a relationship cannot be created; the transaction is rolled back.
     */
    public function execute(CreateCouponDTO $payload)
    {
        DB::begin_transaction();

        try {
            $coupon = $this->coupon_service->create($payload);

            throw_if(empty($coupon), __('Coupon could not be created.', 'kirki-ecommerce'));

            if (!empty($payload->category_ids)) {
                $coupon->categories()->sync($payload->category_ids);
            }

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

            if (!empty($product_sync_data)) {
                $coupon->products()->sync($product_sync_data);
            }

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

            if (!empty($customer_sync_data)) {
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
