<?php

namespace Kirki\Ecommerce\App\Mails\Admins;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Supports\Url;

class AdminOutOfStockMail extends Mailer
{
    /** @var Variant */
    protected $variant;

    public function __construct(Variant $variant)
    {
        $this->variant = $variant;
    }

    public function option_key()
    {
        return 'admin_emails.inventory_notifications.out_of_stock';
    }

    public function with()
    {
        $product_edit_url = Url::get_product_edit_url($this->variant->product_id);

        return [
            'product_name' => $this->variant->product->title ?? '',
            'variant_name' => $this->variant->variant_name,
            'sku' => $this->variant->sku,
            'available_quantity' => $this->variant->available_quantity,
            'product_edit_link' => $product_edit_url,
            'product_edit_link_button' => $this->get_content('emails.parts.link-button', [
                'label' => __('Restock Now', 'kirki-ecommerce'),
                'link' => $product_edit_url,
            ]),
            'product_stock_info' => $this->get_content('emails.parts.product.stock-info', []),
        ];
    }
}
