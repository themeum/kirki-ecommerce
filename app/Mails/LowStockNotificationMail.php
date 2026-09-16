<?php

namespace Kirki\Ecommerce\App\Mails;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Supports\Url;

class LowStockNotificationMail extends Mailer
{
    /** @var Variant */
    protected $variant;

    /** @var string */
    protected $key;

    public function __construct(Variant $variant, string $option_key)
    {
        $this->variant = $variant;
        $this->key = $option_key;
    }

    public function option_key()
    {
        return $this->key;
    }

    public function with()
    {
        return [
            'product_name' => $this->variant->product->title ?? '',
            'product_sku' => $this->variant->sku,
            'available_quantity' => $this->variant->available_quantity,
            'product_edit_url' => Url::get_product_admin_edit_url($this->variant->product_id),
        ];
    }
}
