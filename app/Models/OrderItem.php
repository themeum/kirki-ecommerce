<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Database\Query\Model;
use Kirki\Ecommerce\Supports\Arr;

class OrderItem extends Model
{
    protected $table = 'kirki_ecommerce_order_items';

    protected $fillable = [
        'order_id',
        'product_id',
        'variant_id',
        'product_name',
        'variant_name',
        'sku',
        'barcode',
        'product_image',
        'tax_rate',
        'tax_total',
        'tax_total_base',
        'tax_breakdown',
        'discount_amount',
        'discount_amount_base',
        'price',
        'price_base',
        'quantity',
        'subtotal',
        'subtotal_base',
        'total',
        'total_base',
        'is_physical_product',
        'weight',
        'weight_unit',
        'product_data',
    ];

    protected $casts = [
        'is_physical_product' => 'boolean',
        'tax_rate' => 'float',
        'weight' => 'float',
        'product_data' => 'json',
        'quantity' => 'integer',
        'tax_breakdown' => 'json',
    ];

    public function set_product_data_attribute($value)
    {
        return !empty($value) && is_array($value) ? Arr::json_encode($value) : null;
    }

    public function set_tax_breakdown_attribute($value)
    {
        return !empty($value) && is_array($value) ? Arr::json_encode($value) : null;
    }

    public function order()
    {
        return $this->belongs_to(Order::class, 'order_id');
    }

    public function product()
    {
        return $this->belongs_to(Product::class, 'product_id');
    }

    public function variant()
    {
        return $this->belongs_to(Variant::class, 'variant_id');
    }
}
