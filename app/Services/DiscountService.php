<?php

namespace Kirki\Ecommerce\App\Services;

use Brick\Math\RoundingMode;
use Kirki\Ecommerce\App\Constants\Coupon\CouponStatus;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountTarget;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerExcludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\CustomerIncludeEligibility;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\Constants\Coupon\EligibleItemType;
use Kirki\Ecommerce\App\Constants\Coupon\SpendConditionType;
use Kirki\Ecommerce\App\Constants\Coupon\TargetCountryType;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Calculation\CalculationContextDTO;
use Kirki\Ecommerce\App\DTO\Discount\CouponDiscountResultDTO;
use Kirki\Ecommerce\App\DTO\Discount\DiscountCalculationResultDTO;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\user;

class DiscountService
{
    /**
     * Validate coupon.
     *
     * @param Coupon $coupon
     * @param CalculationContextDTO $context
     * @param string[]|null $already_applied_coupon_codes Codes of coupons already confirmed valid in this same
     *        calculation. Only `calculate()`'s batch loop needs to pass this explicitly - it validates coupons
     *        one at a time, so `$context->coupons` (the full candidate list) still includes ones not yet
     *        confirmed valid, and even the coupon being validated itself. Every other caller can omit it: it
     *        defaults to `$context->coupons` minus the coupon's own code, which is already correct whenever
     *        the coupon being validated isn't part of that list yet (e.g. applying a new coupon to a cart).
     * @throws ValidationException
     */
    public function validate_coupon(Coupon $coupon, CalculationContextDTO $context, ?array $already_applied_coupon_codes = null)
    {
        if ($already_applied_coupon_codes === null) {
            $already_applied_coupon_codes = array_diff($context->coupons, [$coupon->code]);
        }

        $this->validate_status($coupon);
        $this->validate_items_eligibility($coupon, $context);
        $this->validate_conditions($coupon, $context);
        $this->validate_region($coupon, $context);
        $this->validate_customers_eligibility($coupon, $context);
        $this->validate_against_other_applied_coupons($coupon, $already_applied_coupon_codes);
    }

    protected function validate_status(Coupon $coupon)
    {
        $status = $coupon->get_status();

        switch ($status) {
            case CouponStatus::EXPIRED:
                throw new ValidationException(esc_html__('Coupon has expired.', 'kirki-ecommerce'));
            case CouponStatus::INACTIVE:
                throw new ValidationException(esc_html__('Coupon is inactive.', 'kirki-ecommerce'));
            case CouponStatus::SCHEDULED:
                throw new ValidationException(esc_html__('Coupon has not started yet.', 'kirki-ecommerce'));
            default:
                break;
        }
    }

    protected function validate_items_eligibility(Coupon $coupon, CalculationContextDTO $context)
    {
        // A coupon that declares no item scope - free shipping, buy x get y -
        // applies to the cart as a whole, so there is nothing to match against.
        if (empty($coupon->eligible_item_type)) {
            return;
        }

        $eligible_items = $this->get_eligible_items($context, $coupon);

        if ($eligible_items->is_empty()) {
            throw new ValidationException(esc_html__('No eligible items found.', 'kirki-ecommerce'));
        }
    }

    protected function validate_conditions(Coupon $coupon, CalculationContextDTO $context)
    {
        if ($coupon->has_usage_limit && $coupon->current_usage_count >= $coupon->usage_limit) {
            throw new ValidationException(esc_html__('Coupon usage limit reached.', 'kirki-ecommerce'));
        }

        if ($coupon->spend_condition_type === SpendConditionType::MIN_CART_AMOUNT && $coupon->spend_condition_value > $context->get_subtotal()) {
            throw new ValidationException(sprintf(esc_html__('Minimum spend of %s required.', 'kirki-ecommerce'), $coupon->spend_condition_value));
        }

        if ($coupon->spend_condition_type === SpendConditionType::MIN_ITEMS && $coupon->spend_condition_value > $context->get_items_count()) {
            throw new ValidationException(sprintf(esc_html__('Minimum %s items required.', 'kirki-ecommerce'), $coupon->spend_condition_value));
        }

        // Has customer limit
        if ($coupon->has_customer_limit && $coupon->customer_limit > 0) {
            if (!$context->customer_id || empty(user()->get_id())) {
                throw new ValidationException(esc_html__('Please login to use this coupon.', 'kirki-ecommerce'));
            }

            $current_customer_usage = $coupon->order_coupons()
                ->where('customer_id', $context->customer_id)
                ->where_null('usage_reversed_at')
                ->count();

            if ($current_customer_usage >= $coupon->customer_limit) {
                throw new ValidationException(esc_html__('You have reached the usage limit for this coupon.', 'kirki-ecommerce'));
            }
        }
    }

    protected function validate_customers_eligibility(Coupon $coupon, CalculationContextDTO $context)
    {
        $excluded_customers = $coupon->customers->filter(fn($customer) => !empty($customer->pivot['is_excluded']));
        $included_customers = $coupon->customers->reject(fn($customer) => !empty($customer->pivot['is_excluded']));

        $is_registered_customer = !empty($context->customer_id);

        // Include only registered customers
        if ($coupon->customer_include_eligibility === CustomerIncludeEligibility::CUSTOMERS && !$is_registered_customer) {
            throw new ValidationException(esc_html__('Please login to use this coupon.', 'kirki-ecommerce'));
        }

        // Include only guests
        if ($coupon->customer_include_eligibility === CustomerIncludeEligibility::GUESTS && $is_registered_customer) {
            throw new ValidationException(esc_html__('This coupon is only available for guest checkout.', 'kirki-ecommerce'));
        }

        // Exclude all registered customers
        if ($coupon->customer_exclude_eligibility === CustomerExcludeEligibility::CUSTOMERS && $is_registered_customer) {
            throw new ValidationException(esc_html__('This coupon is not available for you.', 'kirki-ecommerce'));
        }

        // Exclude all guests
        if ($coupon->customer_exclude_eligibility === CustomerExcludeEligibility::GUESTS && !$is_registered_customer) {
            throw new ValidationException(esc_html__('Please login to use this coupon.', 'kirki-ecommerce'));
        }

        // Exclude specific customers
        if ($coupon->customer_exclude_eligibility === CustomerExcludeEligibility::SPECIFIC_CUSTOMERS && $excluded_customers->count() > 0) {
            if ($context->customer_id && $excluded_customers->pluck('id')->contains($context->customer_id)) {
                throw new ValidationException(esc_html__('This coupon is not available for you.', 'kirki-ecommerce'));
            }
        }

        // Include specific customers
        if ($coupon->customer_include_eligibility === CustomerIncludeEligibility::SPECIFIC_CUSTOMERS && $included_customers->count() > 0) {
            if (!$context->customer_id || !$included_customers->pluck('id')->contains($context->customer_id)) {
                throw new ValidationException(esc_html__('This coupon is not available for you.', 'kirki-ecommerce'));
            }
        }

        // First time buyer
        if ($coupon->first_time_buyer_only) {
            if (!$context->customer_id || empty(user()->get_id())) {
                throw new ValidationException(esc_html__('Please login to use this coupon.', 'kirki-ecommerce'));
            }

            if ($context->customer_order_count > 0) {
                throw new ValidationException(esc_html__('This coupon is only available for first time buyers.', 'kirki-ecommerce'));
            }
        }
    }

    protected function validate_region(Coupon $coupon, CalculationContextDTO $context)
    {
        if ($coupon->target_country_type === TargetCountryType::SPECIFIC_COUNTRIES && !empty($coupon->target_countries)) {
            if (!$context->shipping_address) {
                throw new ValidationException(esc_html__('Please provide a shipping address to use this coupon.', 'kirki-ecommerce'));
            }

            $shipping_country = $context->shipping_address['country'] ?? null;
            $shipping_state = $context->shipping_address['state'] ?? null;

            $matched_region = collection($coupon->target_countries)
                ->first(function ($region) use ($shipping_country) {
                    return ($region['country'] ?? null) === $shipping_country;
                });

            if (empty($matched_region)) {
                throw new ValidationException(esc_html__('This coupon is not valid for your shipping country.', 'kirki-ecommerce'));
            }

            $target_states = array_map('strval', $matched_region['states'] ?? []);

            if (!empty($target_states) && !in_array((string) $shipping_state, $target_states, true)) {
                throw new ValidationException(esc_html__('This coupon is not valid for your shipping state.', 'kirki-ecommerce'));
            }
        }
    }

    /**
     * Reject a coupon that's already applied, and serve as the seam for a
     * future coupon-combinability rule. Every other combination is allowed
     * today - a future rule (reading `coupons.combinations`) plugs in here
     * without touching calculation math.
     *
     * @param Coupon $coupon
     * @param string[] $already_applied_coupon_codes
     * @throws ValidationException
     */
    protected function validate_against_other_applied_coupons(Coupon $coupon, array $already_applied_coupon_codes)
    {
        if (in_array($coupon->code, $already_applied_coupon_codes, true)) {
            throw new ValidationException(esc_html__('This coupon is already applied.', 'kirki-ecommerce'));
        }
    }

    /**
     * Calculate discounts for the context against every applied coupon.
     *
     * Coupons that fail validation are excluded from the calculation and
     * reported back via `invalid_coupons`, rather than aborting the whole
     * calculation - the remaining valid coupons still apply.
     *
     * @param CalculationContextDTO $context
     * @param Coupon[] $coupons
     * @return DiscountCalculationResultDTO
     */
    public function calculate(CalculationContextDTO $context, array $coupons)
    {
        $result = new DiscountCalculationResultDTO();

        if (empty($coupons)) {
            return $result;
        }

        $valid_coupons = [];
        $already_applied_codes = [];

        foreach ($coupons as $coupon) {
            try {
                $this->validate_coupon($coupon, $context, $already_applied_codes);
                $valid_coupons[] = $coupon;
                $already_applied_codes[] = $coupon->code;
            } catch (ValidationException $e) {
                $result->invalid_coupons[] = $coupon;
            }
        }

        if (empty($valid_coupons)) {
            return $result;
        }

        // Running remaining subtotal per item, reduced as each pass/coupon consumes it.
        $remaining_per_item = [];

        foreach ($context->items as $item) {
            $remaining_per_item[$item->variant_id] = $item->base_unit_price * $item->quantity;
        }

        // Pass 1: item-scoped coupons apply directly and independently to their
        // eligible items - two item-scoped coupons on the same item both apply,
        // summed, neither capping nor excluding the other.
        foreach ($valid_coupons as $coupon) {
            if ($coupon->discount_type !== DiscountType::AMOUNT_OFF || $coupon->discount_target !== DiscountTarget::PRODUCTS) {
                continue;
            }

            $coupon_result = $this->apply_item_scoped_amount_off($context, $coupon);
            $result->coupon_results[] = $coupon_result;

            foreach ($coupon_result->item_discounts as $variant_id => $amount) {
                $result->item_discounts[$variant_id] = ($result->item_discounts[$variant_id] ?? 0) + $amount;
                $remaining_per_item[$variant_id] = max(0, ($remaining_per_item[$variant_id] ?? 0) - $amount);
            }
        }

        // Pass 2: cart-wide coupons apply sequentially against whatever subtotal
        // pass 1 (and each earlier pass-2 coupon) left remaining.
        foreach ($valid_coupons as $coupon) {
            if ($coupon->discount_type !== DiscountType::AMOUNT_OFF || $coupon->discount_target !== DiscountTarget::ORDER) {
                continue;
            }

            $coupon_result = $this->apply_order_scoped_amount_off($coupon, $remaining_per_item);
            $result->coupon_results[] = $coupon_result;

            foreach ($coupon_result->item_discounts as $variant_id => $amount) {
                $result->item_discounts[$variant_id] = ($result->item_discounts[$variant_id] ?? 0) + $amount;
                $remaining_per_item[$variant_id] = max(0, ($remaining_per_item[$variant_id] ?? 0) - $amount);
            }
        }

        // Free shipping - the actual shipping amount waived isn't known until
        // shipping is calculated, so the caller fills in `shipping_discount`.
        foreach ($valid_coupons as $coupon) {
            if ($coupon->discount_type !== DiscountType::FREE_SHIPPING) {
                continue;
            }

            $result->is_free_shipping = true;

            $coupon_result = new CouponDiscountResultDTO();
            $coupon_result->coupon = $coupon;
            $result->coupon_results[] = $coupon_result;
        }

        // Buy-x-get-y is not implemented yet - record the coupon as applied
        // with no discount, matching today's no-op, rather than dropping it.
        foreach ($valid_coupons as $coupon) {
            if ($coupon->discount_type !== DiscountType::BUY_X_GET_Y) {
                continue;
            }

            $coupon_result = new CouponDiscountResultDTO();
            $coupon_result->coupon = $coupon;
            $result->coupon_results[] = $coupon_result;
        }

        $this->clamp_item_discounts($context, $result);

        return $result;
    }

    /**
     * Two item-scoped coupons on the same item are each capped individually
     * at that item's subtotal, but their sum can still exceed it. When that
     * happens, scale every contributing coupon's share of that item down
     * proportionally (via the same largest-remainder method) so the combined
     * discount never exceeds the item's subtotal, and every coupon's reported
     * total still reconciles exactly with what was actually applied.
     *
     * @param CalculationContextDTO $context
     * @param DiscountCalculationResultDTO $result
     */
    protected function clamp_item_discounts(CalculationContextDTO $context, DiscountCalculationResultDTO $result)
    {
        $item_subtotals = [];

        foreach ($context->items as $item) {
            $item_subtotals[$item->variant_id] = $item->base_unit_price * $item->quantity;
        }

        foreach ($result->item_discounts as $variant_id => $total_for_item) {
            $subtotal = $item_subtotals[$variant_id] ?? 0;

            if ($total_for_item <= $subtotal) {
                continue;
            }

            $contributing_results = [];
            $weights = [];

            foreach ($result->coupon_results as $index => $coupon_result) {
                if (!empty($coupon_result->item_discounts[$variant_id])) {
                    $contributing_results[$index] = $coupon_result;
                    $weights[$index] = $coupon_result->item_discounts[$variant_id];
                }
            }

            if (empty($contributing_results)) {
                continue;
            }

            $scaled_shares = $this->allocate_by_weight($subtotal, $weights);

            foreach ($contributing_results as $index => $coupon_result) {
                $old_amount = $coupon_result->item_discounts[$variant_id];
                $new_amount = $scaled_shares[$index];

                $coupon_result->item_discounts[$variant_id] = $new_amount;
                $coupon_result->total_discount -= ($old_amount - $new_amount);
            }

            $result->item_discounts[$variant_id] = $subtotal;
        }
    }

    /**
     * Apply an item-scoped amount-off coupon: each eligible item is discounted
     * independently against its own subtotal.
     *
     * @param CalculationContextDTO $context
     * @param Coupon $coupon
     * @return CouponDiscountResultDTO
     */
    protected function apply_item_scoped_amount_off(CalculationContextDTO $context, Coupon $coupon)
    {
        $coupon_result = new CouponDiscountResultDTO();
        $coupon_result->coupon = $coupon;

        $eligible_items = $this->get_eligible_items($context, $coupon);

        $eligible_items->each(function ($item) use ($coupon, $coupon_result) {
            $item_subtotal = $item->base_unit_price * $item->quantity;

            if ($coupon->discount_value_type === DiscountValueType::FIXED) {
                $amount = $this->get_fixed_discounted_amount($coupon->base_discount_amount_fixed, $item_subtotal);
            } else {
                $amount = $this->get_percent_discounted_amount($coupon->discount_amount_percentage, $item_subtotal);
            }

            $coupon_result->item_discounts[$item->variant_id] = $amount;
            $coupon_result->total_discount += $amount;
        });

        return $coupon_result;
    }

    /**
     * Apply a cart-wide amount-off coupon against the subtotal remaining after
     * earlier passes, allocating the total exactly across items by weight.
     *
     * @param Coupon $coupon
     * @param array<int, int> $remaining_per_item
     * @return CouponDiscountResultDTO
     */
    protected function apply_order_scoped_amount_off(Coupon $coupon, array $remaining_per_item)
    {
        $coupon_result = new CouponDiscountResultDTO();
        $coupon_result->coupon = $coupon;

        $remaining_subtotal = array_sum($remaining_per_item);

        if ($remaining_subtotal <= 0) {
            return $coupon_result;
        }

        if ($coupon->discount_value_type === DiscountValueType::FIXED) {
            $total_discount = $this->get_fixed_discounted_amount($coupon->base_discount_amount_fixed, $remaining_subtotal);
        } else {
            $total_discount = $this->get_percent_discounted_amount($coupon->discount_amount_percentage, $remaining_subtotal);
        }

        $coupon_result->item_discounts = $this->allocate_by_weight($total_discount, $remaining_per_item);
        $coupon_result->total_discount = $total_discount;

        return $coupon_result;
    }

    /**
     * Get fixed discounted amount, capped at the amount it is being applied against.
     *
     * @param int $discount_amount
     * @param int $amount
     * @return int
     */
    protected function get_fixed_discounted_amount($discount_amount, $amount)
    {
        if ($discount_amount > $amount) {
            return $amount;
        }

        return $discount_amount;
    }

    /**
     * Get percent wise discounted amount.
     *
     * @param int|float $discount_amount
     * @param int $amount
     * @return int
     */
    protected function get_percent_discounted_amount($discount_amount, $amount)
    {
        $money_amount = Money::of_minor($amount);

        $discount_value = $money_amount->multipliedBy($discount_amount / 100, RoundingMode::HALF_UP);

        if ($discount_value->isGreaterThan($money_amount)) {
            return $money_amount->getMinorAmount()->toInt();
        }

        return $discount_value->getMinorAmount()->toInt();
    }

    /**
     * Split a total amount across weighted buckets so every share is an exact
     * integer minor unit and the shares sum to exactly `$total_amount` - no
     * fractional unit lost or invented. Uses the largest-remainder method:
     * each bucket's share is truncated down first, then the leftover minor
     * units are handed out one at a time to the buckets with the largest
     * truncated remainder (ties broken by key, for determinism).
     *
     * @param int $total_amount
     * @param array<int|string, int> $weights
     * @return array<int|string, int>
     */
    protected function allocate_by_weight($total_amount, array $weights)
    {
        $shares = array_fill_keys(array_keys($weights), 0);

        $total_weight = array_sum($weights);

        if ($total_amount <= 0 || $total_weight <= 0) {
            return $shares;
        }

        $remainders = [];
        $allocated = 0;

        foreach ($weights as $key => $weight) {
            if ($weight <= 0) {
                continue;
            }

            $product = $total_amount * $weight;
            $shares[$key] = intdiv($product, $total_weight);
            $remainders[$key] = $product % $total_weight;
            $allocated += $shares[$key];
        }

        $leftover = $total_amount - $allocated;

        if ($leftover <= 0) {
            return $shares;
        }

        $remainder_keys = array_keys($remainders);

        usort($remainder_keys, function ($a, $b) use ($remainders) {
            return $remainders[$b] <=> $remainders[$a] ?: $a <=> $b;
        });

        foreach ($remainder_keys as $key) {
            if ($leftover <= 0) {
                break;
            }

            $shares[$key]++;
            $leftover--;
        }

        return $shares;
    }

    /**
     * Get eligible items.
     *
     * @param CalculationContextDTO $context
     * @param Coupon $coupon
     * @return Collection
     */
    protected function get_eligible_items(CalculationContextDTO $context, Coupon $coupon)
    {
        if ($coupon->discount_type === DiscountType::FREE_SHIPPING || $coupon->eligible_item_type === EligibleItemType::ALL_PRODUCTS || $coupon->discount_target === DiscountTarget::ORDER) {
            return $context->items;
        }

        $items = [];

        $product_ids = $coupon->products->pluck('id')->to_array();
        $category_ids = $coupon->categories->pluck('id')->to_array();

        foreach ($context->items as $item) {
            if ($coupon->eligible_item_type === EligibleItemType::SPECIFIC_PRODUCTS && in_array($item->product_id, $product_ids, true)) {
                $items[] = $item;
            } elseif ($coupon->eligible_item_type === EligibleItemType::SPECIFIC_CATEGORIES) {
                if (array_intersect($item->product_categories, $category_ids)) {
                    $items[] = $item;
                }
            }
        }

        return collection($items);
    }
}
