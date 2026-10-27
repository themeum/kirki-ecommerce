<?php

namespace Kirki\Ecommerce\Tests\Support\Racing;

use Kirki\Ecommerce\App\Services\CouponService;

/**
 * Coupon service that runs a competing action just before a coupon use is counted.
 *
 * @since 1.0.0
 */
class RacingCouponService extends CouponService
{
    /** @var callable|null */
    public $before_count;

    /**
     * Let the competitor run once, then count the use as before.
     *
     * @since 1.0.0
     *
     * @param int    $id     Coupon ID.
     * @param string $column Column to increment.
     * @param int    $count  Amount to add.
     * @return bool
     */
    public function increment(int $id, string $column, int $count = 1)
    {
        $this->compete();

        return parent::increment($id, $column, $count);
    }

    /**
     * Let the competitor run once, then claim the use.
     *
     * @since 1.0.0
     *
     * @param int $id Coupon ID.
     * @return bool
     */
    public function claim_usage(int $id)
    {
        $this->compete();

        return parent::claim_usage($id);
    }

    /**
     * Run the competitor callback once.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function compete()
    {
        if ($this->before_count) {
            $callback = $this->before_count;
            $this->before_count = null;
            $callback();
        }
    }
}
