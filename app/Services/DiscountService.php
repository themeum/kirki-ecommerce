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
use Kirki\Ecommerce\App\DTO\Discount\DiscountCalculationResultDTO;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\App\Facades\Money;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\throw_anyway;
use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

class DiscountService
{
    /**
     * Validate coupon.
     *
     * @param Coupon $coupon
     * @param CalculationContextDTO $context
     * @throws ValidationException
     */
    public function validate_coupon(Coupon $coupon, CalculationContextDTO $context)
    {
        $this->validate_status($coupon);
        $this->validate_items_eligibility($coupon, $context);
        $this->validate_conditions($coupon, $context);
        $this->validate_region($coupon, $context);
        $this->validate_customers_eligibility($coupon, $context);
    }

    protected function validate_status(Coupon $coupon)
    {
        $status = $coupon->get_status();

        switch ($status) {
            case CouponStatus::EXPIRED:
                throw_anyway(__('Coupon has expired.', 'kirki-ecommerce'), ValidationException::class);
            case CouponStatus::INACTIVE:
                throw_anyway(__('Coupon is inactive.', 'kirki-ecommerce'), ValidationException::class);
            case CouponStatus::SCHEDULED:
                throw_anyway(__('Coupon has not started yet.', 'kirki-ecommerce'), ValidationException::class);
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

        throw_if($eligible_items->is_empty(), __('No eligible items found.', 'kirki-ecommerce'), ValidationException::class);
    }

    protected function validate_conditions(Coupon $coupon, CalculationContextDTO $context)
    {
        throw_if($coupon->has_usage_limit && $coupon->current_usage_count >= $coupon->usage_limit, __('Coupon usage limit reached.', 'kirki-ecommerce'), ValidationException::class);

        /* translators: %s: minimum spend amount */
        throw_if($coupon->spend_condition_type === SpendConditionType::MIN_CART_AMOUNT && $coupon->spend_condition_value > $context->get_subtotal(), sprintf(__('Minimum spend of %s required.', 'kirki-ecommerce'), $coupon->spend_condition_value), ValidationException::class);

        /* translators: %s: minimum number of items */
        throw_if($coupon->spend_condition_type === SpendConditionType::MIN_ITEMS && $coupon->spend_condition_value > $context->get_items_count(), sprintf(__('Minimum %s items required.', 'kirki-ecommerce'), $coupon->spend_condition_value), ValidationException::class);

        // Has customer limit
        if ($coupon->has_customer_limit && $coupon->customer_limit > 0) {
            throw_if(!$context->customer_id || empty(user()->get_id()), __('Please login to use this coupon.', 'kirki-ecommerce'), ValidationException::class);

            $current_customer_usage = $coupon->usage()->where('customer_id', $context->customer_id)->count();

            throw_if($current_customer_usage >= $coupon->customer_limit, __('You have reached the usage limit for this coupon.', 'kirki-ecommerce'), ValidationException::class);
        }
    }

    protected function validate_customers_eligibility(Coupon $coupon, CalculationContextDTO $context)
    {
        $excluded_customers = $coupon->customers->filter(fn($customer) => !empty($customer->pivot['is_excluded']));
        $included_customers = $coupon->customers->reject(fn($customer) => !empty($customer->pivot['is_excluded']));

        $is_registered_customer = !empty($context->customer_id);

        // Include only registered customers
        throw_if($coupon->customer_include_eligibility === CustomerIncludeEligibility::CUSTOMERS && !$is_registered_customer, __('Please login to use this coupon.', 'kirki-ecommerce'), ValidationException::class);

        // Include only guests
        throw_if($coupon->customer_include_eligibility === CustomerIncludeEligibility::GUESTS && $is_registered_customer, __('This coupon is only available for guest checkout.', 'kirki-ecommerce'), ValidationException::class);

        // Exclude all registered customers
        throw_if($coupon->customer_exclude_eligibility === CustomerExcludeEligibility::CUSTOMERS && $is_registered_customer, __('This coupon is not available for you.', 'kirki-ecommerce'), ValidationException::class);

        // Exclude all guests
        throw_if($coupon->customer_exclude_eligibility === CustomerExcludeEligibility::GUESTS && !$is_registered_customer, __('Please login to use this coupon.', 'kirki-ecommerce'), ValidationException::class);

        // Exclude specific customers
        if ($coupon->customer_exclude_eligibility === CustomerExcludeEligibility::SPECIFIC_CUSTOMERS && $excluded_customers->count() > 0) {
            throw_if($context->customer_id && $excluded_customers->pluck('id')->contains($context->customer_id), __('This coupon is not available for you.', 'kirki-ecommerce'), ValidationException::class);
        }

        // Include specific customers
        if ($coupon->customer_include_eligibility === CustomerIncludeEligibility::SPECIFIC_CUSTOMERS && $included_customers->count() > 0) {
            throw_if(!$context->customer_id || !$included_customers->pluck('id')->contains($context->customer_id), __('This coupon is not available for you.', 'kirki-ecommerce'), ValidationException::class);
        }

        // First time buyer
        if ($coupon->first_time_buyer_only) {
            throw_if(!$context->customer_id || empty(user()->get_id()), __('Please login to use this coupon.', 'kirki-ecommerce'), ValidationException::class);

            throw_if($context->customer_order_count > 0, __('This coupon is only available for first time buyers.', 'kirki-ecommerce'), ValidationException::class);
        }
    }

    protected function validate_region(Coupon $coupon, CalculationContextDTO $context)
    {
        if ($coupon->target_country_type === TargetCountryType::SPECIFIC_COUNTRIES && !empty($coupon->target_countries)) {
            throw_if(!$context->shipping_address, __('Please provide a shipping address to use this coupon.', 'kirki-ecommerce'), ValidationException::class);

            $shipping_country = $context->shipping_address['country'] ?? null;
            $shipping_state = $context->shipping_address['state'] ?? null;

            $matched_region = collection($coupon->target_countries)
                ->first(function ($region) use ($shipping_country) {
                    return ($region['country'] ?? null) === $shipping_country;
                });

            throw_if(empty($matched_region), __('This coupon is not valid for your shipping country.', 'kirki-ecommerce'), ValidationException::class);

            $target_states = array_map('strval', $matched_region['states'] ?? []);

            throw_if(!empty($target_states) && !in_array((string) $shipping_state, $target_states, true), __('This coupon is not valid for your shipping state.', 'kirki-ecommerce'), ValidationException::class);
        }
    }

    /**
     * Calculate discounts for the context.
     *
     * @param CalculationContextDTO $context
     * @param Coupon|null $coupon
     * @return DiscountCalculationResultDTO
     */
    public function calculate(CalculationContextDTO $context, Coupon $coupon)
    {
        $result = new DiscountCalculationResultDTO();

        if (empty($coupon)) {
            return $result;
        }

        // @todo: implement automatic coupon calculation logic

        $this->validate_coupon($coupon, $context);

        $result->discount_details = $coupon;

        switch ($coupon->discount_type) {
            case DiscountType::AMOUNT_OFF:
                return $this->apply_amount_off($context, $coupon, $result);
            case DiscountType::FREE_SHIPPING:
                $result->is_free_shipping = true;
                return $result;
            case DiscountType::BUY_X_GET_Y:
                return $result;
        }

        return $result;
    }

    /**
     * Apply amount off discount.
     *
     * @param CalculationContextDTO $context
     * @param Coupon $coupon
     * @param DiscountCalculationResultDTO $result
     * @return DiscountCalculationResultDTO
     */
    protected function apply_amount_off(CalculationContextDTO $context, Coupon $coupon, DiscountCalculationResultDTO $result)
    {
        $eligible_items = $this->get_eligible_items($context, $coupon);

        $eligible_items->each(function ($item) use ($coupon, $result, $context) {
            $item_subtotal = $item->base_unit_price * $item->quantity;

            if ($coupon->discount_value_type === DiscountValueType::FIXED) {
                $result->item_discounts[$item->variant_id] = $this->get_fixed_discounted_amount($coupon->discount_target, $coupon->base_discount_amount_fixed, $item_subtotal, $context->get_subtotal());
            } elseif ($coupon->discount_value_type === DiscountValueType::PERCENTAGE) {
                $result->item_discounts[$item->variant_id] = $this->get_percent_discounted_amount($coupon->discount_amount_percentage, $item_subtotal);
            }
        });

        return $result;
    }

    /**
     * Get fixed discounted amount.
     *
     * @param int|float $discount_amount
     * @param int $amount
     * @return int
     */
    protected function get_fixed_discounted_amount($discount_target, $discount_amount, $item_subtotal, $order_subtotal)
    {
        if ($discount_target === DiscountTarget::ORDER) {
            $product = Money::from_minor($discount_amount * $item_subtotal);
            $item_discount = $product->dividedBy($order_subtotal, RoundingMode::HALF_UP);

            return $item_discount->getMinorAmount()->toInt();
        }

        if ($discount_amount > $item_subtotal) {
            return $item_subtotal;
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
