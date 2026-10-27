<?php

namespace Kirki\Ecommerce\App\Mcp\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerExcludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerIncludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\Constants\Coupon\TargetCountryType;
use Kirki\Ecommerce\App\Models\Coupon;

/**
 * Gives the arguments, the admin form data and the plain-words rules of coupon write tools.
 * The class must use ReadsStoreValues and ValidatesArguments, and extend StoreWriteTool.
 *
 * @since 1.0.0
 */
trait HandlesCoupons
{
    /**
     * Get the schema of the coupon fields, the same fields as the admin coupon form.
     *
     * @since 1.0.0
     *
     * @param JsonSchema $schema Schema builder.
     *
     * @return array<string, mixed>
     */
    protected function coupon_schema(JsonSchema $schema)
    {
        return [
            'method' => $schema->string()->enum(CouponMethod::get_constant_values())->description('"code": the customer types a code. "automatic": the discount applies by itself.'),
            'title' => $schema->string()->description('Coupon title, for the merchant.'),
            'code' => $schema->string()->description('Code that the customer types, for the "code" method. When it is empty, the preview gives a new code; send that code in the confirmed call.'),
            'discount_type' => $schema->string()->enum(DiscountType::get_constant_values())->description('Kind of discount.'),
            'discount_target' => $schema->string()->enum(DiscountTarget::get_constant_values())->description('For "amount-off": the discount applies to the whole order or to products.'),
            'eligible_item_type' => $schema->string()->enum(EligibleItemType::get_constant_values())->description('For a products target: which products get the discount.'),
            'discount_value_type' => $schema->string()->enum(DiscountValueType::get_constant_values())->description('For "amount-off": a percentage or a fixed amount.'),
            'discount_amount' => $schema->number()->min(0)->description('For "amount-off": a percentage from 0 to 100, or a decimal amount in the store currency.'),
            'is_active' => $schema->boolean()->description('The coupon can be used now.'),
            'start_datetime' => $schema->string()->description('Start in ISO 8601 with an offset, for example 2026-11-01T00:00:00+01:00. Default for a new coupon: now.'),
            'has_end_datetime' => $schema->boolean()->description('The coupon has an end date-time.'),
            'end_datetime' => $schema->string()->description('End in ISO 8601 with an offset. Required when "has_end_datetime" is true.'),
            'has_usage_limit' => $schema->boolean()->description('Limit the total number of uses.'),
            'usage_limit' => $schema->integer()->min(1)->description('Total number of uses.'),
            'has_customer_limit' => $schema->boolean()->description('Limit the uses of each customer.'),
            'customer_limit' => $schema->integer()->min(1)->description('Uses of each customer.'),
            'product_ids' => $schema->array()->items($schema->integer())->description('Product IDs, for "specific-products".'),
            'category_ids' => $schema->array()->items($schema->integer())->description('Category IDs, for "specific-categories".'),
            'target_country_type' => $schema->string()->enum(TargetCountryType::get_constant_values())->description('All countries or specific countries.'),
            'target_countries' => $schema->array()->items($schema->string())->description('Country codes, for "specific-countries".'),
            'first_time_buyer_only' => $schema->boolean()->description('Only for the first order of a customer.'),
            'customer_include_eligibility' => $schema->string()->enum(CustomerIncludeEligibility::get_constant_values())->description('Who can use the coupon.'),
            'customer_ids' => $schema->array()->items($schema->integer())->description('Customer IDs, for "specific-customers".'),
            'customer_exclude_eligibility' => $schema->string()->enum(CustomerExcludeEligibility::get_constant_values())->description('Who cannot use the coupon.'),
            'exclude_customer_ids' => $schema->array()->items($schema->integer())->description('Customer IDs to exclude, for "specific-customers".'),
        ];
    }

    /**
     * Get the names of the coupon fields.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    protected function coupon_fields()
    {
        return [
            'method', 'title', 'code', 'discount_type', 'discount_target', 'eligible_item_type', 'discount_value_type', 'discount_amount', 'is_active',
            'start_datetime', 'has_end_datetime', 'end_datetime', 'has_usage_limit', 'usage_limit', 'has_customer_limit', 'customer_limit',
            'product_ids', 'category_ids', 'target_country_type', 'target_countries', 'first_time_buyer_only',
            'customer_include_eligibility', 'customer_ids', 'customer_exclude_eligibility', 'exclude_customer_ids',
        ];
    }

    /**
     * Reject a discount amount that is not a valid percentage or money amount.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Coupon data.
     *
     * @return void
     */
    protected function check_discount_amount(array $data)
    {
        if (($data['discount_type'] ?? null) !== DiscountType::AMOUNT_OFF || !isset($data['discount_amount']) || $data['discount_amount'] === '') {
            return;
        }

        if (($data['discount_value_type'] ?? null) === DiscountValueType::FIXED) {
            $this->to_minor($data['discount_amount'], 'discount_amount');

            return;
        }

        if (!is_numeric($data['discount_amount']) || $data['discount_amount'] < 0 || $data['discount_amount'] > 100) {
            $this->reject(['discount_amount' => [__('A percentage "discount_amount" must be a number from 0 to 100.', 'kirki-ecommerce')]]);
        }
    }

    /**
     * Get the admin form data of a stored coupon.
     *
     * @since 1.0.0
     *
     * @param Coupon $coupon Coupon with its categories, products and customers.
     *
     * @return array<string, mixed>
     */
    protected function coupon_form_data(Coupon $coupon)
    {
        $is_fixed = $coupon->discount_value_type === DiscountValueType::FIXED;
        $customers = $coupon->customers->all();

        return [
            'method' => $coupon->method ?? CouponMethod::CODE,
            'title' => $coupon->title,
            'code' => $coupon->code,
            'discount_type' => $coupon->discount_type ?? DiscountType::AMOUNT_OFF,
            'discount_target' => $coupon->discount_target,
            'eligible_item_type' => $coupon->eligible_item_type,
            'discount_value_type' => $coupon->discount_value_type,
            'discount_amount' => $is_fixed ? $this->money_amount($coupon->base_discount_amount_fixed) : $coupon->discount_amount_percentage,
            'is_active' => (bool) $coupon->is_active,
            'start_datetime' => $this->datetime($coupon->start_datetime),
            'has_end_datetime' => (bool) $coupon->has_end_datetime,
            'end_datetime' => $coupon->has_end_datetime ? $this->datetime($coupon->end_datetime) : null,
            'has_usage_limit' => (bool) $coupon->has_usage_limit,
            'usage_limit' => $coupon->usage_limit === null ? null : (int) $coupon->usage_limit,
            'has_customer_limit' => (bool) $coupon->has_customer_limit,
            'customer_limit' => $coupon->customer_limit === null ? null : (int) $coupon->customer_limit,
            'product_ids' => array_map('intval', $coupon->products->pluck('id')->to_array()),
            'category_ids' => array_map('intval', $coupon->categories->pluck('id')->to_array()),
            'target_country_type' => $coupon->target_country_type ?? TargetCountryType::ALL_COUNTRIES,
            'target_countries' => $coupon->target_countries,
            'first_time_buyer_only' => (bool) $coupon->first_time_buyer_only,
            'customer_include_eligibility' => $coupon->customer_include_eligibility ?? CustomerIncludeEligibility::EVERYONE,
            'customer_ids' => $this->customer_ids($customers, false),
            'customer_exclude_eligibility' => $coupon->customer_exclude_eligibility ?? CustomerExcludeEligibility::NONE,
            'exclude_customer_ids' => $this->customer_ids($customers, true),
        ];
    }

    /**
     * Get the coupon fields that a coupon change shows, as stored.
     *
     * @since 1.0.0
     *
     * @param Coupon $coupon Coupon with its relations.
     *
     * @return array<string, mixed>
     */
    protected function coupon_summary(Coupon $coupon)
    {
        $data = $this->coupon_form_data($coupon);
        $data['coupon_id'] = (int) $coupon->id;
        $data['status'] = $coupon->get_status();
        $data['current_usage_count'] = (int) ($coupon->current_usage_count ?? 0);
        $data['title'] = $this->store_text($coupon->title);
        $data['rules'] = $this->coupon_rules($data);

        return $data;
    }

    /**
     * Describe the coupon rules in plain words.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Coupon form data, with the amount as a decimal.
     *
     * @return string[]
     */
    protected function coupon_rules(array $data)
    {
        $rules = [];

        if (($data['method'] ?? '') === CouponMethod::AUTOMATIC) {
            $rules[] = __('Applies by itself, with no code.', 'kirki-ecommerce');
        } else {
            /* translators: %s: coupon code. */
            $rules[] = sprintf(__('Code: %s.', 'kirki-ecommerce'), (string) ($data['code'] ?? ''));
        }

        $rules[] = $this->discount_rule($data);

        /* translators: %s: start date-time. */
        $rules[] = sprintf(__('Starts: %s.', 'kirki-ecommerce'), (string) ($data['start_datetime'] ?? __('now', 'kirki-ecommerce')));
        /* translators: %s: end date-time. */
        $rules[] = !empty($data['has_end_datetime']) ? sprintf(__('Ends: %s.', 'kirki-ecommerce'), (string) $data['end_datetime']) : __('No end date.', 'kirki-ecommerce');

        if (!empty($data['has_usage_limit'])) {
            /* translators: %d: number of uses. */
            $rules[] = sprintf(__('At most %d uses in total.', 'kirki-ecommerce'), (int) $data['usage_limit']);
        }

        if (!empty($data['has_customer_limit'])) {
            /* translators: %d: number of uses. */
            $rules[] = sprintf(__('At most %d uses for each customer.', 'kirki-ecommerce'), (int) $data['customer_limit']);
        }

        if (($data['target_country_type'] ?? '') === TargetCountryType::SPECIFIC_COUNTRIES) {
            /* translators: %s: comma separated country codes. */
            $rules[] = sprintf(__('Only for orders to: %s.', 'kirki-ecommerce'), implode(', ', (array) ($data['target_countries'] ?? [])));
        }

        if (!empty($data['first_time_buyer_only'])) {
            $rules[] = __('Only for the first order of a customer.', 'kirki-ecommerce');
        }

        /* translators: 1: who can use the coupon, 2: who cannot use the coupon. */
        $rules[] = sprintf(__('Customers: %1$s; excluded: %2$s.', 'kirki-ecommerce'), (string) ($data['customer_include_eligibility'] ?? CustomerIncludeEligibility::EVERYONE), (string) ($data['customer_exclude_eligibility'] ?? CustomerExcludeEligibility::NONE));
        $rules[] = !empty($data['is_active']) ? __('Active.', 'kirki-ecommerce') : __('Not active.', 'kirki-ecommerce');

        return $rules;
    }

    /**
     * Describe the discount in plain words.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Coupon form data, with the amount as a decimal.
     *
     * @return string
     */
    protected function discount_rule(array $data)
    {
        if (($data['discount_type'] ?? '') === DiscountType::FREE_SHIPPING) {
            return __('Free shipping.', 'kirki-ecommerce');
        }

        if (($data['discount_type'] ?? '') === DiscountType::BUY_X_GET_Y) {
            return __('Buy X get Y.', 'kirki-ecommerce');
        }

        $amount = ($data['discount_value_type'] ?? '') === DiscountValueType::FIXED
            ? $this->money($this->to_minor($data['discount_amount'] ?? 0, 'discount_amount'))['display']
            : (float) ($data['discount_amount'] ?? 0) . '%';

        if (($data['discount_target'] ?? '') !== DiscountTarget::PRODUCTS) {
            /* translators: %s: discount amount. */
            return sprintf(__('%s off the order.', 'kirki-ecommerce'), $amount);
        }

        switch ($data['eligible_item_type'] ?? EligibleItemType::ALL_PRODUCTS) {
            case EligibleItemType::SPECIFIC_PRODUCTS:
                /* translators: 1: discount amount, 2: number of products. */
                return sprintf(__('%1$s off %2$d products.', 'kirki-ecommerce'), $amount, count((array) ($data['product_ids'] ?? [])));
            case EligibleItemType::SPECIFIC_CATEGORIES:
                /* translators: 1: discount amount, 2: number of categories. */
                return sprintf(__('%1$s off the products of %2$d categories.', 'kirki-ecommerce'), $amount, count((array) ($data['category_ids'] ?? [])));
            default:
                /* translators: %s: discount amount. */
                return sprintf(__('%s off all products.', 'kirki-ecommerce'), $amount);
        }
    }

    /**
     * Turn minor units into a decimal amount in the base currency.
     *
     * @since 1.0.0
     *
     * @param int|null $minor Amount in minor units.
     *
     * @return float|null
     */
    protected function money_amount($minor)
    {
        $money = $this->money($minor);

        return $money === null ? null : $money['amount'];
    }

    /**
     * Get the IDs of the included or excluded customers of a coupon.
     *
     * @since 1.0.0
     *
     * @param array<int, mixed> $customers Customers with the pivot.
     * @param bool              $excluded  Get the excluded customers.
     *
     * @return int[]
     */
    protected function customer_ids(array $customers, bool $excluded)
    {
        $ids = [];

        foreach ($customers as $customer) {
            if ((bool) ($customer->pivot['is_excluded'] ?? false) === $excluded) {
                $ids[] = (int) $customer->id;
            }
        }

        return $ids;
    }
}
