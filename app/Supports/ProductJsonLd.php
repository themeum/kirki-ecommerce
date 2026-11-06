<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;

use function Kirki\Ecommerce\Framework\view_data;

/**
 * Builds the schema.org Product structured data of a product page.
 *
 * Every product prints the same field set, filled from the resolved SEO data and
 * the product data; a field with no data is left out. The plugin stores no
 * reviews, so ratings and reviews are never printed.
 *
 * @since 1.0.0
 */
class ProductJsonLd
{
    /**
     * Barcode lengths that are valid GTINs.
     *
     * @var int[]
     */
    const GTIN_LENGTHS = [8, 12, 13, 14];

    /**
     * Build the structured data of the product page being rendered.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $seo The resolved SEO data.
     * @return array<string, mixed> The structured data after the plugin filter.
     */
    public static function current(array $seo)
    {
        $product = view_data();
        $data = static::build($seo, $product);

        return apply_filters(DevHookNames::PRODUCT_JSON_LD, $data, $seo, $product);
    }

    /**
     * Build the structured data array.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $seo     The resolved SEO data.
     * @param array<string, mixed> $product The product resource array.
     * @return array<string, mixed>
     */
    public static function build(array $seo, array $product)
    {
        $items = $seo['offers']['items'] ?? [];

        $data = [
            '@context' => 'https://schema.org',
            '@type' => 'Product',
            'name' => $seo['title'] ?? '',
            'description' => $seo['description'] ?? '',
            'image' => static::unwrap($seo['images'] ?? []),
            'sku' => static::pick_variant_value($items, 'sku'),
            'gtin' => static::pick_gtin($items),
            'category' => static::category_path($product),
            'brand' => static::build_brand($product),
            'offers' => static::build_offers($seo),
            'url' => $seo['url'] ?? '',
        ];

        return array_filter($data, [static::class, 'is_filled']);
    }

    /**
     * Whether a value holds data that is worth printing.
     *
     * @since 1.0.0
     *
     * @param mixed $value The value.
     * @return bool
     */
    protected static function is_filled($value)
    {
        return $value !== '' && $value !== null && $value !== [];
    }

    /**
     * Return the only item of a one-item list, or the list itself.
     *
     * @since 1.0.0
     *
     * @param array<int, string> $values The list.
     * @return string|array<int, string>
     */
    protected static function unwrap(array $values)
    {
        return count($values) === 1 ? $values[0] : $values;
    }

    /**
     * Get a value from the default variant, else from the first variant that has one.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $items Visible variant offers.
     * @param string                           $key   Key to read.
     * @return string
     */
    protected static function pick_variant_value(array $items, string $key)
    {
        usort($items, function ($first, $second) {
            return (int) !empty($second['is_default']) <=> (int) !empty($first['is_default']);
        });

        foreach ($items as $item) {
            if (!empty($item[$key])) {
                return (string) $item[$key];
            }
        }

        return '';
    }

    /**
     * Get the barcode of the preferred variant when it is a valid GTIN length.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $items Visible variant offers.
     * @return string
     */
    protected static function pick_gtin(array $items)
    {
        $barcode = static::pick_variant_value($items, 'barcode');

        if (ctype_digit($barcode) && in_array(strlen($barcode), static::GTIN_LENGTHS, true)) {
            return $barcode;
        }

        return '';
    }

    /**
     * Build a category path such as "Lighting > Lamps" from the deepest assigned category.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product The product resource array.
     * @return string
     */
    protected static function category_path(array $product)
    {
        $categories = $product['categories'] ?? [];
        $categories = is_object($categories) && method_exists($categories, 'all') ? $categories->all() : (array) $categories;
        $by_id = [];

        foreach ($categories as $category) {
            if (is_array($category) && isset($category['id'])) {
                $by_id[$category['id']] = $category;
            }
        }

        if ($by_id === []) {
            return '';
        }

        usort($by_id, function ($first, $second) {
            return (int) ($second['level'] ?? 0) <=> (int) ($first['level'] ?? 0);
        });

        $by_id = array_column($by_id, null, 'id');
        $current = reset($by_id);
        $names = [];

        while ($current) {
            array_unshift($names, (string) ($current['name'] ?? ''));
            $current = $by_id[$current['parent_id'] ?? null] ?? null;
        }

        return implode(' > ', array_filter($names, 'strlen'));
    }

    /**
     * Build the brand node from the brand name and logo.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product The product resource array.
     * @return array<string, string>|string
     */
    protected static function build_brand(array $product)
    {
        if (empty($product['brand']['name'])) {
            return '';
        }

        $brand = [
            'name' => (string) $product['brand']['name'],
            'logo' => (string) ($product['brand']['logo']['url'] ?? ''),
        ];

        return ['@type' => 'Brand'] + array_filter($brand, [static::class, 'is_filled']);
    }

    /**
     * Build the Offer, or AggregateOffer for several variants.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $seo The resolved SEO data.
     * @return array<string, mixed>|string
     */
    protected static function build_offers(array $seo)
    {
        $items = $seo['offers']['items'] ?? [];

        if ($items === []) {
            return '';
        }

        $prices = array_column($items, 'base_price');
        $availability = static::aggregate_availability($items);

        $offer = ['@type' => count($items) > 1 ? 'AggregateOffer' : 'Offer'];

        if (count($items) > 1) {
            $offer['offerCount'] = count($items);
            $offer['lowPrice'] = static::extreme($prices, 'min');
            $offer['highPrice'] = static::extreme($prices, 'max');
        } else {
            $offer['price'] = $prices[0];
        }

        $offer['priceCurrency'] = (string) ($seo['offers']['currency'] ?? '');
        $offer['availability'] = ProductSeo::SCHEMA_URL . $availability;
        $offer['itemCondition'] = ProductSeo::SCHEMA_URL . 'NewCondition';
        $offer['url'] = $seo['url'] ?? '';

        if (!empty($seo['site_name'])) {
            $offer['seller'] = ['@type' => 'Organization', 'name' => (string) $seo['site_name']];
        }

        return array_filter($offer, [static::class, 'is_filled']);
    }

    /**
     * Get the lowest or highest of decimal price strings, keeping the string as given.
     *
     * @since 1.0.0
     *
     * @param string[] $prices Decimal price strings.
     * @param string   $mode   `min` or `max`.
     * @return string
     */
    protected static function extreme(array $prices, string $mode)
    {
        usort($prices, function ($first, $second) {
            return (float) $first <=> (float) $second;
        });

        return $mode === 'min' ? $prices[0] : $prices[count($prices) - 1];
    }

    /**
     * Get the availability of a set of variants: in stock, else back order, else out of stock.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, mixed>> $items Visible variant offers.
     * @return string
     */
    protected static function aggregate_availability(array $items)
    {
        $states = array_column($items, 'availability');

        foreach (['InStock', 'BackOrder'] as $state) {
            if (in_array($state, $states, true)) {
                return $state;
            }
        }

        return 'OutOfStock';
    }
}
