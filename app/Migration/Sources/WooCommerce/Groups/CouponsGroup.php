<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Coupon\CreateCouponDTO;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers\CouponMapper;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\App\Models\OrderCoupon;

use function Kirki\Ecommerce\Framework\app;

/**
 * Migrates WooCommerce coupons.
 *
 * Imported usage counts are kept. A coupon whose restriction cannot be kept is skipped, so no coupon
 * becomes wider than it was.
 *
 * @since 1.0.0
 */
class CouponsGroup extends WooCommerceGroup
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function id()
    {
        return 'coupons';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function label()
    {
        return __('Coupons', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function description()
    {
        return __('Discount codes with their limits and usage counts.', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function depends_on()
    {
        return ['settings', 'products', 'categories', 'customers'];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function count()
    {
        return $this->database->count_coupons();
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function entity()
    {
        return 'coupon';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fetch(int $cursor, int $limit)
    {
        $rows = $this->database->posts_of_type('shop_coupon', WooCommerceDatabase::POST_STATUSES, $cursor, $limit);
        $meta = $this->database->post_meta(array_column($rows, 'id'), CouponMapper::META_KEYS);

        foreach ($rows as $index => $row) {
            $rows[$index]['meta'] = $meta[$row['id']] ?? [];
        }

        return $rows;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function map(array $row, RecordLedger $ledger)
    {
        return (new CouponMapper())->map($row, $ledger);
    }

    /**
     * Create the coupon, its restrictions and its imported usage count.
     *
     * @since 1.0.0
     *
     * @inheritDoc
     */
    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        $fields = $mapped['coupon'];

        foreach ($mapped['notes'] as $note) {
            $this->note($note);
        }

        $code = $this->unique_code($fields['code']);

        $dto = new CreateCouponDTO([
            'title' => $fields['title'],
            'code' => $code,
            'discount_type' => $fields['discount_type'],
            'discount_target' => $fields['discount_target'],
            'discount_value_type' => $fields['discount_value_type'],
            'discount_amount' => $fields['discount_amount'],
            'eligible_item_type' => $fields['eligible_item_type'],
            'spend_condition_type' => $fields['spend_condition_type'] ?? null,
            'spend_condition_value' => $fields['spend_condition_value'] ?? null,
            'has_end_datetime' => $fields['has_end_datetime'],
            'end_datetime' => $fields['end_datetime'],
            'customer_include_eligibility' => $fields['customer_include_eligibility'] ?? 'everyone',
            'has_usage_limit' => $fields['has_usage_limit'],
            'usage_limit' => $fields['usage_limit'],
            'has_customer_limit' => $fields['has_customer_limit'],
            'customer_limit' => $fields['customer_limit'],
            'is_active' => $fields['is_active'],
        ]);

        $coupon = app(CouponService::class)->create($dto);

        if (!empty($fields['category_ids'])) {
            $coupon->categories()->sync($fields['category_ids']);
        }

        if (!empty($fields['product_ids'])) {
            $coupon->products()->sync(array_fill_keys($fields['product_ids'], ['is_reward_item' => 0]));
        }

        if (!empty($fields['customer_ids'])) {
            $coupon->customers()->sync(array_fill_keys($fields['customer_ids'], ['is_excluded' => 0]));
        }

        $this->restore_history((int) $coupon->id, $fields);

        return (int) $coupon->id;
    }

    /**
     * Give the coupon a code that no Kirki coupon uses.
     *
     * @since 1.0.0
     *
     * @param string $code The code in WooCommerce.
     * @return string
     */
    protected function unique_code(string $code)
    {
        $candidate = $code;
        $suffix = 1;

        while (Coupon::query()->where('code', $candidate)->first()) {
            $suffix++;
            $candidate = $code . '-' . $suffix;
        }

        if ($candidate !== $code) {
            $this->note(sprintf(
                /* translators: 1: coupon code in WooCommerce, 2: coupon code saved in Kirki */
                __('The coupon code "%1$s" was already used, so it was saved as "%2$s".', 'kirki-ecommerce'),
                $code,
                $candidate
            ));
        }

        return $candidate;
    }

    /**
     * Keep the imported usage count and the original creation date.
     *
     * Usage is set directly and does not go through usage counting, which is off during migration.
     *
     * @since 1.0.0
     *
     * @param int                  $coupon_id The Kirki coupon id.
     * @param array<string, mixed> $fields    The mapped coupon fields.
     * @return void
     */
    protected function restore_history(int $coupon_id, array $fields)
    {
        $history = ['current_usage_count' => (int) $fields['usage_count']];

        if ($fields['created_at'] !== null) {
            $history['created_at'] = $fields['created_at'];
        }

        Coupon::query()->where('id', $coupon_id)->update($history);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function revert_record(string $entity, int $kirki_ecommerce_id, $previous_value = null)
    {
        return $this->remove_record(Coupon::class, $kirki_ecommerce_id, OrderCoupon::query()->where('coupon_id', $kirki_ecommerce_id)->exists());
    }
}
