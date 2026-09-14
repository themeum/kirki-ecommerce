<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

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
        'invoiced_tax_total',
        'base_tax_total',
        'invoiced_discount_amount',
        'base_discount_amount',
        'invoiced_price',
        'base_price',
        'quantity',
        'invoiced_subtotal',
        'base_subtotal',
        'invoiced_total',
        'base_total',
        'is_physical_product',
        'weight',
        'weight_unit',
        'product_data',
    ];

    protected $casts = [
        'order_id' => 'integer',
        'product_id' => 'integer',
        'variant_id' => 'integer',
        'is_physical_product' => 'boolean',
        'weight' => 'float',
        'product_data' => 'json',
        'quantity' => 'integer',
    ];

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

    public function order_item_coupons()
    {
        return $this->has_many(OrderItemCoupon::class, 'order_item_id');
    }

    public function taxes()
    {
        return $this->has_many(OrderTax::class, 'order_item_id');
    }
}
