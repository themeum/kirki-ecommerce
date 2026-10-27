<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\Constants\Coupon\CouponStatus;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountType;
use Kirki\Ecommerce\App\Constants\Coupon\DiscountValueType;
use Kirki\Ecommerce\App\DTO\Coupon\CouponFilterDTO;
use Kirki\Ecommerce\App\Mcp\Concerns\PagesResults;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\CouponService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

/**
 * Lists coupons with their status, value and usage, with the filters of the admin coupon list.
 *
 * @since 1.0.0
 */
class FindCouponsTool extends StoreReadTool
{
    use PagesResults;

    /** @var string */
    protected $description = 'Find coupons and automatic discounts of the store with the filters of the admin coupon list. '
        . 'Use it for questions such as "which offers run now?" (status active) or "which coupons are near their limit?". '
        . 'Each coupon has its ID, code or title, method, discount type, value (a fixed amount in the store currency or a percentage), status, start and end date, usage count, usage limit and limit per customer.';

    /** @var CouponService */
    protected $coupon_service;

    /**
     * Create the tool with the coupon service.
     *
     * @since 1.0.0
     *
     * @param CouponService $coupon_service Service of the admin coupon list.
     */
    public function __construct(CouponService $coupon_service)
    {
        $this->coupon_service = $coupon_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function input_schema(JsonSchema $schema)
    {
        return array_merge([
            'search' => $schema->string()
                ->description('Part of a coupon code or title.'),
            'status' => $schema->string()
                ->enum(CouponStatus::get_constant_values())
                ->description('Coupon status.'),
            'method' => $schema->string()
                ->enum(CouponMethod::get_constant_values())
                ->description('A code that customers enter, or a discount that applies automatically.'),
            'discount_type' => $schema->string()
                ->enum(DiscountType::get_constant_values())
                ->description('Discount type.'),
        ], $this->page_schema($schema));
    }

    /**
     * Find the coupons that match the arguments.
     *
     * @since 1.0.0
     *
     * @param Request $request Tool arguments.
     *
     * @return Response
     * @throws ValidationException When an argument is not valid.
     */
    public function handle(Request $request)
    {
        $statuses = CouponStatus::get_constant_values();
        $methods = CouponMethod::get_constant_values();
        $discount_types = DiscountType::get_constant_values();

        $params = $this->validate_arguments($request->all(), array_merge([
            'search' => 'nullable|string|max:100',
            'status' => 'nullable|string|in:' . implode(',', $statuses),
            'method' => 'nullable|string|in:' . implode(',', $methods),
            'discount_type' => 'nullable|string|in:' . implode(',', $discount_types),
        ], $this->page_rules()), array_merge([
            'search.string' => __('The "search" must be text of at most 100 characters.', 'kirki-ecommerce'),
            'search.max' => __('The "search" must be text of at most 100 characters.', 'kirki-ecommerce'),
            'status.in' => $this->one_of_message('status', $statuses),
            'method.in' => $this->one_of_message('method', $methods),
            'discount_type.in' => $this->one_of_message('discount_type', $discount_types),
        ], $this->page_messages()));
        [$page, $per_page] = $this->page_arguments($params);

        $coupons = $this->coupon_service->paginated(CouponFilterDTO::from_array([
            'search' => $params['search'] ?? null,
            'status' => $params['status'] ?? null,
            'method' => $params['method'] ?? null,
            'discount_type' => $params['discount_type'] ?? null,
            'page' => $page,
            'limit' => $per_page,
        ]));

        return Response::structured([
            'coupons' => array_values(array_map([$this, 'coupon_row'], $coupons->items()->all())),
            'pagination' => $this->pagination($coupons),
        ]);
    }

    /**
     * Shape one coupon into a compact row.
     *
     * @since 1.0.0
     *
     * @param Coupon $coupon Coupon of the list.
     *
     * @return array<string, mixed>
     */
    protected function coupon_row(Coupon $coupon)
    {
        $is_fixed = $coupon->discount_value_type === DiscountValueType::FIXED;

        return [
            'coupon_id' => (int) $coupon->id,
            'code' => $coupon->code,
            'title' => $coupon->title,
            'method' => $coupon->method ?? CouponMethod::CODE,
            'discount_type' => $coupon->discount_type ?? DiscountType::AMOUNT_OFF,
            'discount_value_type' => $coupon->discount_value_type,
            'base_discount_amount' => $is_fixed ? $this->money($coupon->base_discount_amount_fixed) : null,
            'discount_percentage' => $is_fixed || $coupon->discount_amount_percentage === null ? null : (float) $coupon->discount_amount_percentage,
            'status' => $coupon->get_status(),
            'starts_at' => $this->datetime($coupon->start_datetime),
            'ends_at' => $coupon->has_end_datetime ? $this->datetime($coupon->end_datetime) : null,
            'usage_count' => (int) $coupon->current_usage_count,
            'usage_limit' => $coupon->has_usage_limit ? (int) $coupon->usage_limit : null,
            'limit_per_customer' => $coupon->has_customer_limit ? (int) $coupon->customer_limit : null,
        ];
    }
}
