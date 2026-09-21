<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

/**
 * Model for a line item of an order, snapshotting the product, variant and prices at purchase time.
 *
 * @since 1.0.0
 */
class OrderItem extends Model
{
    /** @inheritDoc */
    protected $table = 'kirki_ecommerce_order_items';

    /** @inheritDoc */
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
        'invoiced_regular_price',
        'base_regular_price',
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

    /** @inheritDoc */
    protected $casts = [
        'order_id' => 'integer',
        'product_id' => 'integer',
        'variant_id' => 'integer',
        'is_physical_product' => 'boolean',
        'weight' => 'float',
        'product_data' => 'json',
        'quantity' => 'integer',
    ];

    /**
     * Define the order this item belongs to.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function order()
    {
        return $this->belongs_to(Order::class, 'order_id');
    }

    /**
     * Define the product this item was purchased from.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function product()
    {
        return $this->belongs_to(Product::class, 'product_id');
    }

    /**
     * Define the variant this item was purchased as.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\BelongsTo
     */
    public function variant()
    {
        return $this->belongs_to(Variant::class, 'variant_id');
    }

    /**
     * Define the coupon discount attributions applied to this item.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function order_item_coupons()
    {
        return $this->has_many(OrderItemCoupon::class, 'order_item_id');
    }

    /**
     * Define the tax lines charged on this item.
     *
     * @since 1.0.0
     *
     * @return \Kirki\Ecommerce\Framework\Database\Query\Relations\HasMany
     */
    public function taxes()
    {
        return $this->has_many(OrderTax::class, 'order_item_id');
    }
}
