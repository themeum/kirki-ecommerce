<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Models\Variant;

class SkuGenerator
{
    protected const SEGMENT_LENGTH = 3;
    protected const SEQUENCE_PADDING = 3;

    /**
     * Compose a SKU from the given product sources.
     *
     * @param array $sources {
     *     @type string|null $title            Product title.
     *     @type string[]    $attribute_values Variant attribute values, in assigned order.
     *     @type string|null $brand            Brand name.
     *     @type string|null $category         First category name.
     * }
     * @return string
     */
    public static function generate(array $sources)
    {
        return static::compose($sources, static::next_sequence());
    }

    /**
     * Compose one SKU per entry, numbering them consecutively from the same
     * starting point.
     *
     * The sequence is read once and advanced in memory, which is what makes a
     * batch differ from repeated `generate()` calls: nothing is stored until
     * the merchant saves, so N separate calls would all read the same maximum
     * and hand back the same number N times.
     *
     * @param array $sources_list Sources keyed however the caller needs the
     *                            results keyed back.
     * @return array
     */
    public static function generate_many(array $sources_list)
    {
        $sequence = static::next_sequence();
        $skus = [];

        foreach ($sources_list as $key => $sources) {
            $skus[$key] = static::compose($sources, $sequence);
            $sequence++;
        }

        return $skus;
    }

    /**
     * Join the segments derived from the given sources with the sequence
     * number, dropping every source that yields no characters.
     *
     * @param array $sources
     * @param int   $sequence
     * @return string
     */
    protected static function compose(array $sources, int $sequence)
    {
        $segments = array_merge(
            [static::segment($sources['title'] ?? null)],
            array_map(
                fn($attribute_value) => static::segment($attribute_value),
                $sources['attribute_values'] ?? []
            ),
            [
                static::segment($sources['brand'] ?? null),
                static::segment($sources['category'] ?? null),
            ]
        );

        $segments = array_filter($segments, fn($segment) => '' !== $segment);
        $segments[] = static::format_sequence($sequence);

        return implode('-', $segments);
    }

    /**
     * Reduce a source to at most three uppercase alphanumeric characters.
     *
     * @param string|null $source
     * @return string
     */
    protected static function segment($source)
    {
        $normalized = preg_replace('/[^A-Z0-9]/', '', strtoupper(remove_accents((string) $source)));

        return substr($normalized, 0, static::SEGMENT_LENGTH);
    }

    /**
     * @param int $sequence
     * @return string
     */
    protected static function format_sequence(int $sequence)
    {
        return str_pad((string) $sequence, static::SEQUENCE_PADDING, '0', STR_PAD_LEFT);
    }

    /**
     * One past the highest number any stored SKU ends with.
     *
     * Nothing is persisted here: a number is only claimed once a variant
     * holding it is saved, so a generated SKU the merchant abandons costs
     * nothing and the next one reuses it. Because the number is above every
     * number already stored, the composed SKU cannot duplicate an existing one.
     *
     * `SUBSTRING_INDEX` and `CAST` are used in place of `REGEXP_SUBSTR`, which
     * needs MySQL 8.0 and would break the MySQL 5.7 floor this plugin supports.
     * A trailing segment that is not numeric casts to 0 and so never raises the
     * sequence.
     *
     * @return int
     */
    protected static function next_sequence()
    {
        $highest = Variant::query()
            ->where_not_null('sku')
            ->select_raw("MAX(CAST(SUBSTRING_INDEX(sku, '-', -1) AS UNSIGNED)) AS highest_sequence")
            ->first();

        return (int) ($highest->highest_sequence ?? 0) + 1;
    }
}
