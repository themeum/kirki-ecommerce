<?php

namespace Kirki\Ecommerce\App\Mails\Admins;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\collection;

/**
 * Email sent to the store admin when a variant goes out of stock.
 *
 * @since 1.0.0
 */
class AdminOutOfStockMail extends Mailer
{
    /** @var Variant */
    protected $variant;

    /**
     * Create the mail for the given variant.
     *
     * @since 1.0.0
     *
     * @param Variant $variant Variant that ran out of stock.
     */
    public function __construct(Variant $variant)
    {
        $this->variant = $variant;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function option_key()
    {
        return 'admin_emails.inventory_notifications.out_of_stock';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function with()
    {
        $product_edit_url = Url::get_product_edit_url($this->variant->product_id);
        $variant = VariantResource::make($this->variant);

        return [
            'variant' => $variant,
            'product_name' => $this->variant->product->title ?? '',
            'variant_name' => collection($variant['attribute_value_labels'])->join(', '),
            'sku' => $this->variant->sku,
            'available_quantity' => $this->variant->available_quantity,
            'product_restock_link' => $this->get_content('emails.parts.link', [
                'label' => __('Restock Now', 'kirki-ecommerce'),
                'link' => $product_edit_url,
            ]),
            'product_restock_link_button' => $this->get_content('emails.parts.link-button', [
                'label' => __('Restock Now', 'kirki-ecommerce'),
                'link' => $product_edit_url,
            ]),
            'product_stock_info' => $this->get_content('emails.parts.product.stock-info', ['variant' => $variant]),
        ];
    }
}
