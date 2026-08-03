<?php

namespace Kirki\Ecommerce\App\Models;

use Kirki\Ecommerce\Framework\Database\Query\Model;

class Variant extends Model
{
    protected $table = 'kirki_ecommerce_variants';
    protected $primary_key = 'id';

    protected $casts = [
        'id' => 'integer',
        'product_id' => 'integer',
        'media' => 'integer',
        'price' => 'integer',
        'show_unit_price' => 'boolean',
        'base_unit' => 'string',
        'base_unit_amount' => 'integer',
        'total_unit' => 'string',
        'total_unit_amount' => 'integer',
        'sale_price' => 'integer',
        'cost_of_goods' => 'integer',
        'weight' => 'float',
        'weight_unit' => 'string',
        'charge_taxes' => 'boolean',
        'allow_back_order' => 'boolean',
        'track_inventory' => 'boolean',
        'available_quantity' => 'integer',
        'in_stock' => 'boolean',
        'committed_quantity' => 'integer',
        'has_limit_per_order' => 'boolean',
        'max_per_order' => 'integer',
        'tax_profile_id' => 'integer',
        'shipping_profile_id' => 'integer',
        'shipping_box_id' => 'integer',
        'is_visible' => 'boolean',
        'is_physical_product' => 'boolean',
        'is_default' => 'boolean',
        'created_by' => 'integer',
        'updated_by' => 'integer',
    ];

    protected $fillable = [
        'product_id',
        'media',
        'sku',
        'barcode',
        'price',
        'show_unit_price',
        'base_unit',
        'base_unit_amount',
        'total_unit',
        'total_unit_amount',
        'sale_price',
        'cost_of_goods',
        'weight',
        'weight_unit',
        'charge_taxes',
        'allow_back_order',
        'track_inventory',
        'available_quantity',
        'in_stock',
        'committed_quantity',
        'has_limit_per_order',
        'max_per_order',
        'tax_profile_id',
        'shipping_profile_id',
        'shipping_box_id',
        'is_visible',
        'is_physical_product',
        'is_default',
        'created_by',
        'updated_by',
    ];

    public function product()
    {
        return $this->belongs_to(Product::class, 'product_id', 'id');
    }

    public function media()
    {
        return $this->belongs_to(Post::class, 'media', 'id');
    }

    public function attribute_values()
    {
        return $this->belongs_to_many(AttributeValue::class, 'kirki_ecommerce_attribute_value_variant', 'variant_id', 'attribute_value_id');
    }

    public function scope_visible($query)
    {
        return $query->where('is_visible', true);
    }
}
