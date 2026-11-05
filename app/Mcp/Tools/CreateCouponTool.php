<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Actions\Coupon\CreateCouponAction;
use Kirki\Ecommerce\App\Constants\Coupon\CouponMethod;
use Kirki\Ecommerce\App\DTO\Coupon\CreateCouponDTO;
use Kirki\Ecommerce\App\Http\Requests\Coupon\CouponCreateRequest;
use Kirki\Ecommerce\App\Mcp\Concerns\HandlesCoupons;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\CouponService;

use function Kirki\Ecommerce\Framework\app;

/**
 * Creates a coupon with the rules of the admin coupon form, after a preview of the rules in plain words.
 *
 * @since 1.0.0
 */
class CreateCouponTool extends StoreWriteTool
{
    use HandlesCoupons;

    /** @var bool */
    protected $destructive = false;

    /** @var string */
    protected $description = 'Create a coupon with the same fields and rules as the admin coupon form. A fixed discount is a decimal amount in the store currency; a percentage is 0 to 100. '
        . 'Call without "confirmation_token" to get a preview with the rules in plain words and a token. When "code" is empty for a code coupon, the preview gives a new code: '
        . 'send it as "code" with the same other arguments and the token to create the coupon.';

    /** @var CouponService */
    protected $coupon_service;

    /**
     * Create the tool with the coupon service.
     *
     * @since 1.0.0
     *
     * @param CouponService $coupon_service Coupon service.
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
    protected function arguments(JsonSchema $schema)
    {
        return $this->coupon_schema($schema);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $params = array_intersect_key($arguments, array_flip($this->coupon_fields()));

        $this->validate_arguments($params, [
            'method' => 'required|string',
            'title' => 'required|string|max:255',
            'discount_type' => 'required|string',
        ], [
            'method.required' => $this->one_of_message('method', CouponMethod::get_constant_values()),
            'title.required' => __('Send the coupon "title".', 'kirki-ecommerce'),
        ]);

        $this->check_discount_amount($params);

        return $params;
    }

    /**
     * The coupon is new, so there is no record to find.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        return null;
    }

    /**
     * Generate a missing code, check the rules of the admin form and describe the coupon.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        if ($params['method'] === CouponMethod::CODE && empty($params['code'])) {
            $params['code'] = $this->coupon_service->generate_new_code();
        }

        $data = $this->form_data($params);
        $this->form_request(CouponCreateRequest::class, $data);

        return [
            'code' => $params['code'] ?? null,
            'title' => $params['title'],
            'rules' => $this->coupon_rules($data),
        ];
    }

    /**
     * Create the coupon.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $request = $this->form_request(CouponCreateRequest::class, $this->form_data($params));
        $coupon = app()->make(CreateCouponAction::class)->execute(CreateCouponDTO::from_request($request));

        return ['coupon' => $this->coupon_summary(Coupon::with(['categories', 'products', 'customers'])->find((int) $coupon->id))];
    }

    /**
     * Get the admin form data, with a start of now when none is sent.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return array<string, mixed>
     */
    protected function form_data(array $params)
    {
        if (empty($params['start_datetime'])) {
            $params['start_datetime'] = $this->datetime(gmdate('Y-m-d H:i:s'));
        }

        return $params;
    }
}
