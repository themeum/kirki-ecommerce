<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Actions\Coupon\UpdateCouponAction;
use Kirki\Ecommerce\App\DTO\Coupon\UpdateCouponDTO;
use Kirki\Ecommerce\App\Http\Requests\Coupon\CouponUpdateRequest;
use Kirki\Ecommerce\App\Mcp\Concerns\HandlesCoupons;
use Kirki\Ecommerce\App\Models\Coupon;

use function Kirki\Ecommerce\Framework\app;

/**
 * Changes the rules of one coupon. Fields that are not sent keep their values.
 *
 * @since 1.0.0
 */
class UpdateCouponTool extends StoreWriteTool
{
    use HandlesCoupons;

    /** @var array<string, mixed> */
    protected $meta = ['anthropic/requiresUserInteraction' => true];

    /** @var string */
    protected $description = 'Change the rules of one coupon, for example a later end date or a higher limit. Fields that are not sent keep their values; the result must pass the rules of the admin coupon form. '
        . 'Call without "confirmation_token" to get a preview with each current and new value and a token, then call again with the same arguments and the token.';

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return [
            'coupon_id' => $schema->integer()->min(1)->description('Coupon ID, from the find-coupons tool.'),
        ] + $this->coupon_schema($schema);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $params = $this->validate_arguments($arguments, ['coupon_id' => 'required|integer|min:1'], [
            'coupon_id.required' => __('Send the "coupon_id", from the find-coupons tool.', 'kirki-ecommerce'),
        ]);

        $fields = array_intersect_key($arguments, array_flip($this->coupon_fields()));

        if (empty($fields)) {
            $this->reject(['coupon_id' => [__('Send at least one coupon field to change.', 'kirki-ecommerce')]]);
        }

        return ['coupon_id' => (int) $params['coupon_id'], 'fields' => $fields];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        $coupon = Coupon::with(['categories', 'products', 'customers'])->find($params['coupon_id']);

        return $coupon === null ? Response::error(__('The coupon was not found. Use the find-coupons tool.', 'kirki-ecommerce')) : $coupon;
    }

    /**
     * Check the merged coupon with the admin rules and show each changed field.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        $current = $this->coupon_form_data($target);
        $merged = $this->merged($params, $target);

        $this->check_discount_amount($merged);
        $this->form_request(CouponUpdateRequest::class, $merged, ['id' => (int) $target->id]);

        $fields = [];

        foreach ($params['fields'] as $field => $value) {
            if ($current[$field] != $value) {
                $fields[$field] = ['current' => $current[$field], 'new' => $value];
            }
        }

        return [
            'coupon_id' => (int) $target->id,
            'title' => $this->store_text($target->title),
            'current_usage_count' => (int) ($target->current_usage_count ?? 0),
            'fields' => $fields,
            'rules' => $this->coupon_rules($merged),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        return $this->hash_values([$this->coupon_form_data($target), (string) $target->updated_at]);
    }

    /**
     * Save the merged coupon.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $request = $this->form_request(CouponUpdateRequest::class, $this->merged($params, $target), ['id' => (int) $target->id]);
        $coupon = app()->make(UpdateCouponAction::class)->execute(UpdateCouponDTO::from_request($request));

        return ['coupon' => $this->coupon_summary(Coupon::with(['categories', 'products', 'customers'])->find((int) $coupon->id))];
    }

    /**
     * Put the sent fields over the stored coupon.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     * @param Coupon               $coupon The coupon.
     *
     * @return array<string, mixed>
     */
    protected function merged(array $params, Coupon $coupon)
    {
        return array_merge($this->coupon_form_data($coupon), $params['fields'], ['id' => (int) $coupon->id]);
    }
}
