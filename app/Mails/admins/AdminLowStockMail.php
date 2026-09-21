<?php

namespace Kirki\Ecommerce\App\Mails\Admins;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Resources\Variant\VariantResource;
use Kirki\Ecommerce\App\Supports\Url;

use function Kirki\Ecommerce\Framework\collection;

class AdminLowStockMail extends Mailer
{
    /** @var Variant */
    protected $variant;

    public function __construct(Variant $variant)
    {
        $this->variant = $variant;
    }

    public function option_key()
    {
        return 'admin_emails.inventory_notifications.low_stock';
    }

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
            'product_restock_link' => $product_edit_url,
            'product_restock_link_button' => $this->get_content('emails.parts.link-button', [
                'label' => __('Restock Now', 'kirki-ecommerce'),
                'link' => $product_edit_url,
            ]),
            'product_stock_info' => $this->get_content('emails.parts.product.stock-info', ['variant' => $variant]),
        ];
    }
}
