<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use DateTimeImmutable;
use Exception;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Mcp\Concerns\DescribesProducts;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Services\ProductService;

/**
 * Publishes, schedules, unpublishes or trashes one product. It never deletes a product for good.
 *
 * @since 1.0.0
 */
class ChangeProductStatusTool extends StoreWriteTool
{
    use DescribesProducts;

    /** @var string */
    protected $description = 'Change the status of one product: "published" shows it in the shop, "scheduled" publishes it at "scheduled_at", "draft" hides it, and "trashed" moves it to the trash. '
        . 'A product in the trash can be restored with "draft" or "published". This tool never deletes a product for good. '
        . 'Call without "confirmation_token" to get a preview and a token, then call again with the same arguments and the token.';

    /** @var ProductService */
    protected $product_service;

    /**
     * Create the tool with the product service.
     *
     * @since 1.0.0
     *
     * @param ProductService $product_service Product service.
     */
    public function __construct(ProductService $product_service)
    {
        $this->product_service = $product_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return [
            'product_id' => $schema->integer()->min(1)->description('Product ID, from the find-products tool.'),
            'status' => $schema->string()->enum(ProductStatus::get_constant_values())->description('New status.'),
            'scheduled_at' => $schema->string()->description('Publish time in ISO 8601 with an offset, for example 2026-11-01T09:00:00+01:00. Required for "scheduled", and it must be in the future.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $statuses = ProductStatus::get_constant_values();

        $params = $this->validate_arguments($arguments, [
            'product_id' => 'required|integer|min:1',
            'status' => 'required|string|in:' . implode(',', $statuses),
            'scheduled_at' => 'nullable|string|max:40',
        ], [
            'product_id.required' => __('Send the "product_id", from the find-products tool.', 'kirki-ecommerce'),
            'status.required' => $this->one_of_message('status', $statuses),
            'status.in' => $this->one_of_message('status', $statuses),
        ]);

        if ($params['status'] !== ProductStatus::SCHEDULED) {
            $params['scheduled_at'] = null;

            return $params;
        }

        $message = __('Send "scheduled_at" as a future date-time in ISO 8601 with an offset, for example 2026-11-01T09:00:00+01:00.', 'kirki-ecommerce');

        try {
            $scheduled_at = new DateTimeImmutable((string) ($params['scheduled_at'] ?? ''));
        } catch (Exception $exception) {
            $scheduled_at = null;
        }

        if (empty($params['scheduled_at']) || $scheduled_at === null || $scheduled_at->getTimestamp() <= time()) {
            $this->reject(['scheduled_at' => [$message]]);
        }

        $params['scheduled_at'] = $scheduled_at->format(DATE_ATOM);

        return $params;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        $product = Product::with('variants')->find((int) $params['product_id']);

        return $product === null ? Response::error(__('The product was not found. Use the find-products tool.', 'kirki-ecommerce')) : $product;
    }

    /**
     * Show the status change and its effect in the shop. Publishing needs a price on each variant.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        $status = $params['status'];

        if ($target->status === $status && $status !== ProductStatus::SCHEDULED) {
            $this->reject(['status' => [__('The product already has this status.', 'kirki-ecommerce')]]);
        }

        if (in_array($status, [ProductStatus::PUBLISHED, ProductStatus::SCHEDULED], true)) {
            foreach ($target->variants->all() as $variant) {
                if ((int) $variant->base_price <= 0) {
                    $this->reject(['status' => [__('A variant of the product has no price (the price is 0). Add the prices before the product is published, or publish it in the admin.', 'kirki-ecommerce')]]);
                }
            }
        }

        return [
            'product_id' => (int) $target->id,
            'title' => $target->title,
            'status' => ['current' => $target->status, 'new' => $status],
            'scheduled_at' => $params['scheduled_at'],
            'effect' => $this->effect($status),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        return $this->hash_values([
            $target->status,
            (string) $target->scheduled_at,
            array_map(function ($variant) {
                return $variant->base_price;
            }, $target->variants->all()),
        ]);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $product = $this->product_service->change_status((int) $target->id, $params['status'], $params['scheduled_at']);

        return ['product' => $this->product_summary($product)];
    }

    /**
     * Describe what the new status does in the shop.
     *
     * @since 1.0.0
     *
     * @param string $status New status.
     *
     * @return string
     */
    protected function effect(string $status)
    {
        switch ($status) {
            case ProductStatus::PUBLISHED:
                return __('The product will be visible in the shop.', 'kirki-ecommerce');
            case ProductStatus::SCHEDULED:
                return __('The product will be hidden until the scheduled time, then visible in the shop.', 'kirki-ecommerce');
            case ProductStatus::TRASHED:
                return __('The product will be hidden and moved to the trash. It can be restored in the admin.', 'kirki-ecommerce');
            default:
                return __('The product will be hidden from the shop.', 'kirki-ecommerce');
        }
    }
}
