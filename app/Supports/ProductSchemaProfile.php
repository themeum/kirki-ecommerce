<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\ProductSchema;

/**
 * Selects the schema profile that decides which structured data fields a product prints.
 *
 * A profile maps a JSON-LD group (Product, Brand, Offer) to the list of fields to print.
 *
 * @since 1.0.0
 */
class ProductSchemaProfile
{
    /**
     * Groups a profile may list; any other group is ignored.
     *
     * @var string[]
     */
    const GROUPS = ['Product', 'Brand', 'Offer', 'AggregateRating', 'Review'];

    /**
     * Fields printed when no stored profile can be used.
     *
     * @var array<string, string[]>
     */
    const BUILT_IN = [
        'Product' => ['name', 'description', 'image', 'sku'],
        'Brand' => ['name'],
        'Offer' => ['price', 'priceCurrency', 'availability'],
    ];

    /**
     * Pick the profile of a product: its own, then the default one, then the built-in set.
     *
     * A stored profile whose data cannot be used is skipped.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product The product resource array.
     * @return array<string, string[]>
     */
    public static function for_product(array $product)
    {
        $schema_id = (int) ($product['schema_id'] ?? 0);

        if ($schema_id > 0) {
            $profile = static::normalize(static::stored_schema(['id' => $schema_id]));

            if ($profile !== null) {
                return $profile;
            }
        }

        $profile = static::normalize(static::stored_schema(['is_default' => true]));

        return $profile ?? static::BUILT_IN;
    }

    /**
     * Clean a stored profile down to known groups and string field names.
     *
     * @since 1.0.0
     *
     * @param mixed $schema The stored profile: an array or a JSON string.
     * @return array<string, string[]>|null The usable profile, or null when it has no known group.
     */
    public static function normalize($schema)
    {
        if (is_string($schema)) {
            $schema = json_decode($schema, true);
        }

        if (!is_array($schema)) {
            return null;
        }

        $profile = [];

        foreach (static::GROUPS as $group) {
            if (!isset($schema[$group]) || !is_array($schema[$group])) {
                continue;
            }

            $profile[$group] = array_values(array_filter($schema[$group], 'is_string'));
        }

        return $profile !== [] ? $profile : null;
    }

    /**
     * Read the schema column of the first profile row that matches the conditions.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $conditions Column values to match.
     * @return mixed The stored schema, or null when no row matches.
     */
    protected static function stored_schema(array $conditions)
    {
        $row = ProductSchema::query()->where($conditions)->first();

        return $row ? $row->schema : null;
    }
}
