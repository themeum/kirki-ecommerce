<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\Framework\Database\Query\Collection;

defined('ABSPATH') || exit;

/**
 * Formats product attributes and their values with respect to variants.
 * 
 * @since 1.0.0
 */
class ProductAttributeFormatter
{
    /**
     * Group attribute values under their attributes.
     *
     * Combines the product's own attribute values with any values used only by its variants.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $attributes       Attribute rows of the product.
     * @param array<int, array<string, mixed>> $attribute_values Attribute value rows of the product.
     * @param Collection<Variant>                       $variants         Variants of the product.
     * @return array<int, array<string, mixed>> Attributes, each with its list of values.
     */
    public static function format($attributes, $attribute_values, $variants)
    {
        $attribute_values_map = [];

        foreach ($attribute_values as $attribute_value) {
            $attribute_values_map[$attribute_value['attribute_id']][] = [
                'id' => $attribute_value['id'],
                'value' => $attribute_value['value'],
                'color' => $attribute_value['color'],
            ];
        }

        foreach ($variants as $variant) {
            foreach ($variant->attribute_values as $attribute_value) {
                $attribute_id = $attribute_value->attribute_id;
                $existing_ids = array_column($attribute_values_map[$attribute_id] ?? [], 'id');

                if (in_array($attribute_value->id, $existing_ids, true)) {
                    continue;
                }

                $attribute_values_map[$attribute_id][] = [
                    'id' => $attribute_value->id,
                    'value' => $attribute_value->value,
                    'color' => $attribute_value->color,
                ];
            }
        }

        $attribute_map = [];

        foreach ($attributes as $attribute) {
            $attribute_map[] = [
                'id' => $attribute['id'],
                'name' => $attribute['name'],
                'values' => $attribute_values_map[$attribute['id']] ?? [],
            ];
        }

        return $attribute_map;
    }
}
