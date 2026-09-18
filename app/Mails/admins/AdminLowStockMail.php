<?php

namespace Kirki\Ecommerce\App\Mails\Admins;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Supports\Url;

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
        return [
            'product_name' => $this->variant->product->title ?? '',
            'product_sku' => $this->variant->sku,
            'available_quantity' => $this->variant->available_quantity,
            'product_edit_url' => Url::get_product_edit_url($this->variant->product_id),
        ];
    }
}
