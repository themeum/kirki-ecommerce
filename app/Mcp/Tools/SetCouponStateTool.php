<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Actions\Coupon\DuplicateCouponAction;
use Kirki\Ecommerce\App\Mcp\Concerns\HandlesCoupons;
use Kirki\Ecommerce\App\Models\Coupon;
use Kirki\Ecommerce\App\Services\CouponService;

use function Kirki\Ecommerce\Framework\app;

/**
 * Turns a coupon on or off, or copies it with a new code.
 *
 * @since 1.0.0
 */
class SetCouponStateTool extends StoreWriteTool
{
    use HandlesCoupons;

    const ACTIONS = ['activate', 'deactivate', 'duplicate'];

    /** @var string */
    protected $description = 'Turn one coupon on ("activate") or off ("deactivate"), for example to stop a leaked code, or copy it ("duplicate") with a new code and " - Copy" after the title. '
        . 'Call without "confirmation_token" to get a preview and a token, then call again with the same arguments and the token.';

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
        return [
            'coupon_id' => $schema->integer()->min(1)->description('Coupon ID, from the find-coupons tool.'),
            'action' => $schema->string()->enum(static::ACTIONS)->description('What to do with the coupon.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        return $this->validate_arguments($arguments, [
            'coupon_id' => 'required|integer|min:1',
            'action' => 'required|string|in:' . implode(',', static::ACTIONS),
        ], [
            'coupon_id.required' => __('Send the "coupon_id", from the find-coupons tool.', 'kirki-ecommerce'),
            'action.required' => $this->one_of_message('action', static::ACTIONS),
            'action.in' => $this->one_of_message('action', static::ACTIONS),
        ]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        $coupon = Coupon::with(['categories', 'products', 'customers'])->find((int) $params['coupon_id']);

        return $coupon === null ? Response::error(__('The coupon was not found. Use the find-coupons tool.', 'kirki-ecommerce')) : $coupon;
    }

    /**
     * Show the current and the new state, or the title of the copy.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        $is_active = (bool) $target->is_active;
        $changes = [
            'coupon_id' => (int) $target->id,
            'title' => $this->store_text($target->title),
            'code' => $target->code,
            'action' => $params['action'],
        ];

        if ($params['action'] === 'duplicate') {
            $changes['copy_title'] = $this->store_text($target->title . ' - Copy');

            return $changes;
        }

        $activate = $params['action'] === 'activate';

        if ($activate === $is_active) {
            $this->reject(['action' => [$activate ? __('The coupon is already active.', 'kirki-ecommerce') : __('The coupon is already inactive.', 'kirki-ecommerce')]]);
        }

        $changes['is_active'] = ['current' => $is_active, 'new' => $activate];

        return $changes;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        return $this->hash_values([(bool) $target->is_active, (string) $target->updated_at]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        if ($params['action'] === 'duplicate') {
            $coupon = app()->make(DuplicateCouponAction::class)->execute((int) $target->id);
        } else {
            $coupon = $this->coupon_service->change_activation_state((int) $target->id, $params['action'] === 'activate');
        }

        return ['coupon' => $this->coupon_summary(Coupon::with(['categories', 'products', 'customers'])->find((int) $coupon->id))];
    }
}
