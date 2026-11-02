<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Coupon\CustomerIncludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\Constants\Coupon\SpendConditionType;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Core\SkipItemException;
use Kirki\Ecommerce\App\Models\Customer;

/**
 * Maps one WooCommerce coupon to the fields of a Kirki coupon.
 *
 * Coupon meta keys and discount types follow the WooCommerce coupon data store.
 *
 * @since 1.0.0
 */
class CouponMapper
{
    /** The coupon meta keys that are read. */
    public const META_KEYS = [
        'discount_type', 'coupon_amount', 'date_expires', 'usage_count', 'usage_limit', 'usage_limit_per_user',
        'individual_use', 'free_shipping', 'minimum_amount', 'maximum_amount', 'exclude_sale_items',
        'limit_usage_to_x_items', 'product_ids', 'exclude_product_ids', 'product_categories',
        'exclude_product_categories', 'customer_email',
    ];

    /**
     * Map a coupon row.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $row    The coupon row with its meta.
     * @param RecordLedger                $ledger The links between source and Kirki records.
     * @return array{coupon: array<string, mixed>, notes: string[]}
     * @throws SkipItemException When the coupon cannot be represented without a wider discount.
     */
    public function map(array $row, RecordLedger $ledger)
    {
        $meta = $row['meta'];
        $code = trim((string) $row['title']);
        $notes = [];

        if ($code === '') {
            throw new SkipItemException(esc_html__('The coupon has no code.', 'kirki-ecommerce'));
        }

        $type = (string) ($meta['discount_type'] ?? 'fixed_cart');
        $amount = (float) ($meta['coupon_amount'] ?? 0);
        $free_shipping = ($meta['free_shipping'] ?? 'no') === 'yes';

        if (!in_array($type, ['percent', 'fixed_cart', 'fixed_product'], true)) {
            throw new SkipItemException(esc_html(sprintf(
                /* translators: %s: WooCommerce discount type */
                __('The discount type "%s" is not supported.', 'kirki-ecommerce'),
                $type
            )));
        }

        $product_ids = $this->linked_products($meta, $ledger);
        $category_ids = $this->linked_categories($meta, $ledger);
        $customer_ids = $this->linked_customers($meta);

        $coupon = [
            'title' => $code,
            'code' => $code,
            'is_active' => $row['status'] === 'publish',
            'product_ids' => [],
            'category_ids' => [],
            'customer_ids' => [],
            'usage_count' => (int) ($meta['usage_count'] ?? 0),
            'created_at' => strpos((string) $row['date_gmt'], '0000-00-00') === 0 ? null : $row['date_gmt'],
        ];

        if ($free_shipping && $amount <= 0) {
            $coupon = array_merge($coupon, [
                'discount_type' => DiscountType::FREE_SHIPPING,
                'discount_target' => null,
                'discount_value_type' => null,
                'discount_amount' => null,
                'eligible_item_type' => null,
            ]);
        } else {
            if ($free_shipping) {
                $notes[] = $this->note($code, __('free shipping is not migrated when the coupon also gives a discount', 'kirki-ecommerce'));
            }

            $is_percent = $type === 'percent';
            $restricted = !empty($product_ids) || !empty($category_ids);

            $coupon = array_merge($coupon, [
                'discount_type' => DiscountType::AMOUNT_OFF,
                'discount_target' => $type === 'fixed_cart' || ($is_percent && !$restricted) ? DiscountTarget::ORDER : DiscountTarget::PRODUCTS,
                'discount_value_type' => $is_percent ? DiscountValueType::PERCENTAGE : DiscountValueType::FIXED,
                'discount_amount' => $is_percent ? $amount : Money::to_minor($meta['coupon_amount'] ?? 0),
                'eligible_item_type' => null,
            ]);

            if ($coupon['discount_target'] === DiscountTarget::PRODUCTS) {
                $coupon['eligible_item_type'] = !empty($product_ids) ? EligibleItemType::SPECIFIC_PRODUCTS : (!empty($category_ids) ? EligibleItemType::SPECIFIC_CATEGORIES : EligibleItemType::ALL_PRODUCTS);
            }
        }

        $this->apply_restrictions($coupon, $product_ids, $category_ids, $customer_ids, $code, $notes);
        $this->apply_limits($coupon, $meta);
        $this->note_unsupported($meta, $code, $notes);

        $coupon['notes'] = $notes;

        return ['coupon' => $coupon, 'notes' => $notes];
    }

    /**
     * Put the product, category and customer restrictions on the coupon.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $coupon       The coupon fields, extended in place.
     * @param int[]                $product_ids  Kirki product ids.
     * @param int[]                $category_ids Kirki category ids.
     * @param int[]                $customer_ids Kirki customer ids.
     * @param string               $code         The coupon code, for notes.
     * @param string[]             $notes        Notes, extended in place.
     * @return void
     */
    protected function apply_restrictions(array &$coupon, array $product_ids, array $category_ids, array $customer_ids, string $code, array &$notes)
    {
        if (!empty($product_ids)) {
            $coupon['product_ids'] = $product_ids;
            $coupon['eligible_item_type'] = $coupon['discount_target'] === DiscountTarget::ORDER ? null : EligibleItemType::SPECIFIC_PRODUCTS;

            if (!empty($category_ids)) {
                $notes[] = $this->note($code, __('Kirki restricts a coupon to products or to categories, not both, so the category restriction was dropped', 'kirki-ecommerce'));
            }
        } elseif (!empty($category_ids)) {
            $coupon['category_ids'] = $category_ids;
            $coupon['eligible_item_type'] = $coupon['discount_target'] === DiscountTarget::ORDER ? null : EligibleItemType::SPECIFIC_CATEGORIES;
        }

        if (!empty($customer_ids)) {
            $coupon['customer_ids'] = $customer_ids;
            $coupon['customer_include_eligibility'] = CustomerIncludeEligibility::SPECIFIC_CUSTOMERS;
        }
    }

    /**
     * Put the expiry, usage limits and minimum spend on the coupon.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $coupon The coupon fields, extended in place.
     * @param array<string, mixed> $meta   The coupon meta.
     * @return void
     */
    protected function apply_limits(array &$coupon, array $meta)
    {
        $expires = (int) ($meta['date_expires'] ?? 0);
        $usage_limit = (int) ($meta['usage_limit'] ?? 0);
        $per_customer = (int) ($meta['usage_limit_per_user'] ?? 0);
        $minimum = (string) ($meta['minimum_amount'] ?? '');

        $coupon['has_end_datetime'] = $expires > 0;
        $coupon['end_datetime'] = $expires > 0 ? gmdate('Y-m-d H:i:s', $expires) : null;
        $coupon['has_usage_limit'] = $usage_limit > 0;
        $coupon['usage_limit'] = $usage_limit > 0 ? $usage_limit : null;
        $coupon['has_customer_limit'] = $per_customer > 0;
        $coupon['customer_limit'] = $per_customer > 0 ? $per_customer : null;

        if ($minimum !== '' && (float) $minimum > 0) {
            $coupon['spend_condition_type'] = SpendConditionType::MIN_CART_AMOUNT;
            $coupon['spend_condition_value'] = Money::to_minor($minimum);
        }
    }

    /**
     * Add a note for each WooCommerce option that Kirki has no matching setting for.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta  The coupon meta.
     * @param string               $code  The coupon code.
     * @param string[]             $notes Notes, extended in place.
     * @return void
     */
    protected function note_unsupported(array $meta, string $code, array &$notes)
    {
        $unsupported = [];

        if ((float) ($meta['maximum_amount'] ?? 0) > 0) {
            $unsupported[] = __('maximum spend', 'kirki-ecommerce');
        }

        if (($meta['exclude_sale_items'] ?? 'no') === 'yes') {
            $unsupported[] = __('exclude sale items', 'kirki-ecommerce');
        }

        if (($meta['individual_use'] ?? 'no') === 'yes') {
            $unsupported[] = __('individual use only', 'kirki-ecommerce');
        }

        if ((int) ($meta['limit_usage_to_x_items'] ?? 0) > 0) {
            $unsupported[] = __('limit to a number of items', 'kirki-ecommerce');
        }

        if (!empty($this->ids($meta['exclude_product_ids'] ?? '')) || !empty($meta['exclude_product_categories'])) {
            $unsupported[] = __('excluded products and categories', 'kirki-ecommerce');
        }

        if (!empty($unsupported)) {
            $notes[] = $this->note($code, sprintf(
                /* translators: %s: list of coupon options */
                __('these options are not migrated: %s', 'kirki-ecommerce'),
                implode(', ', $unsupported)
            ));
        }
    }

    /**
     * Get the Kirki product ids of the products a coupon is limited to.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta   The coupon meta.
     * @param RecordLedger                $ledger The links between source and Kirki records.
     * @return int[]
     * @throws SkipItemException When the coupon is limited to products and none are in Kirki.
     */
    protected function linked_products(array $meta, RecordLedger $ledger)
    {
        $source_ids = $this->ids($meta['product_ids'] ?? '');

        return $this->resolve_all('product', $source_ids, $ledger, __('The coupon is limited to products that are not in Kirki.', 'kirki-ecommerce'));
    }

    /**
     * Get the Kirki category ids of the categories a coupon is limited to.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta   The coupon meta.
     * @param RecordLedger                $ledger The links between source and Kirki records.
     * @return int[]
     * @throws SkipItemException When the coupon is limited to categories and none are in Kirki.
     */
    protected function linked_categories(array $meta, RecordLedger $ledger)
    {
        $source_ids = $this->ids($meta['product_categories'] ?? []);

        return $this->resolve_all('category', $source_ids, $ledger, __('The coupon is limited to categories that are not in Kirki.', 'kirki-ecommerce'));
    }

    /**
     * Get the Kirki customer ids of the emails a coupon is limited to.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta The coupon meta.
     * @return int[]
     * @throws SkipItemException When the coupon is limited to emails and no customer has one.
     */
    protected function linked_customers(array $meta)
    {
        $emails = array_filter(array_map('strtolower', array_map('trim', (array) ($meta['customer_email'] ?? []))));

        if (empty($emails)) {
            return [];
        }

        $ids = [];

        foreach ($emails as $email) {
            $customer = Customer::query()->where('email', $email)->first();

            if ($customer) {
                $ids[] = (int) $customer->id;
            }
        }

        if (empty($ids)) {
            throw new SkipItemException(esc_html__('The coupon is limited to emails that no Kirki customer has.', 'kirki-ecommerce'));
        }

        return $ids;
    }

    /**
     * Resolve source ids to Kirki ids. A restriction that resolves to nothing is an error, not an open coupon.
     *
     * @since 1.0.0
     *
     * @param string   $entity     The record ledger entity.
     * @param int[]    $source_ids The source ids.
     * @param RecordLedger    $ledger     The links between source and Kirki records.
     * @param string   $message    The skip reason when nothing resolves.
     * @return int[]
     * @throws SkipItemException When source ids exist and none resolve.
     */
    protected function resolve_all(string $entity, array $source_ids, RecordLedger $ledger, string $message)
    {
        if (empty($source_ids)) {
            return [];
        }

        $ids = [];

        foreach ($source_ids as $source_id) {
            $kirki_ecommerce_id = $ledger->resolve($entity, $source_id);

            if ($kirki_ecommerce_id !== null) {
                $ids[] = $kirki_ecommerce_id;
            }
        }

        if (empty($ids)) {
            throw new SkipItemException(esc_html($message));
        }

        return $ids;
    }

    /**
     * Turn a comma list or an array of ids into a list of positive integers.
     *
     * @since 1.0.0
     *
     * @param mixed $value The meta value.
     * @return int[]
     */
    protected function ids($value)
    {
        $list = is_array($value) ? $value : explode(',', (string) $value);

        return array_values(array_filter(array_map('intval', $list), function ($id) {
            return $id > 0;
        }));
    }

    /**
     * Build a note about one coupon.
     *
     * @since 1.0.0
     *
     * @param string $code    The coupon code.
     * @param string $message What was changed.
     * @return string
     */
    protected function note(string $code, string $message)
    {
        return sprintf(
            /* translators: 1: coupon code, 2: what was changed */
            __('Coupon "%1$s": %2$s.', 'kirki-ecommerce'),
            $code,
            $message
        );
    }
}
