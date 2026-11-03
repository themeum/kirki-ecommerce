<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Constants\WeightUnit;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\App\Migration\Core\SkipItemException;

/**
 * Maps one WooCommerce product row, with its variations, to a plain description of the Kirki product and variants.
 *
 * It only reads: attributes are described by name and value, and the group creates the records.
 *
 * @since 1.0.0
 */
class ProductMapper
{
    /** @var bool Whether the Yoast SEO plugin is installed. */
    protected $has_yoast;

    /** @var bool Whether the Rank Math SEO plugin is installed. */
    protected $has_rank_math;

    /** @var string The WooCommerce weight unit setting. */
    protected $weight_unit;

    /**
     * Create the mapper.
     *
     * @since 1.0.0
     *
     * @param bool   $has_yoast     Whether Yoast SEO is installed.
     * @param bool   $has_rank_math Whether Rank Math SEO is installed.
     * @param string $weight_unit   The WooCommerce weight unit: kg, g, lbs or oz.
     */
    public function __construct(bool $has_yoast = false, bool $has_rank_math = false, string $weight_unit = 'kg')
    {
        $this->has_yoast = $has_yoast;
        $this->has_rank_math = $has_rank_math;
        $this->weight_unit = $weight_unit;
    }

    /**
     * Map a product row.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $row    The product row from the reader.
     * @param RecordLedger                $ledger The links between source and Kirki records.
     * @return array{product: array<string, mixed>, variants: array<int, array<string, mixed>>, attributes: array<int, array<string, mixed>>, notes: string[]}
     * @throws SkipItemException When the product type cannot be represented.
     */
    public function map(array $row, RecordLedger $ledger)
    {
        $type = $this->product_type($row);

        if (!in_array($type, ['simple', 'variable'], true)) {
            throw new SkipItemException(esc_html(sprintf(
                /* translators: %s: WooCommerce product type */
                __('The product type "%s" is not supported.', 'kirki-ecommerce'),
                $type
            )));
        }

        $notes = [];
        $meta = $row['meta'];
        $is_variable = $type === 'variable' && !empty($row['variations']);
        $attributes = $is_variable ? $this->variation_attributes($row) : [];

        $variants = $is_variable
            ? $this->variable_variants($row, $attributes, $notes)
            : [$this->variant($meta, [], $row['attachments'], true, $row['id'])];

        if ($is_variable && empty($variants)) {
            throw new SkipItemException(esc_html__('The variable product has no variations.', 'kirki-ecommerce'));
        }

        return [
            'product' => $this->product_fields($row, $ledger, $notes),
            'variants' => $variants,
            'attributes' => $attributes,
            'notes' => $notes,
        ];
    }

    /**
     * Get the WooCommerce product type of a row.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $row The product row.
     * @return string The type slug; "simple" when none is saved.
     */
    protected function product_type(array $row)
    {
        return $row['terms']['product_type'][0]['slug'] ?? 'simple';
    }

    /**
     * Build the product fields.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $row    The product row.
     * @param RecordLedger                $ledger The links between source and Kirki records.
     * @param string[]             $notes  Notes to extend.
     * @return array<string, mixed>
     */
    protected function product_fields(array $row, RecordLedger $ledger, array &$notes)
    {
        $status = $this->status($row['status']);
        $meta = $row['meta'];
        $title = trim((string) $row['title']) !== '' ? $row['title'] : __('(no title)', 'kirki-ecommerce');

        if ($row['status'] === 'private') {
            $notes[] = sprintf(
                /* translators: %s: product title */
                __('Product "%s" is private in WooCommerce and was saved as a draft.', 'kirki-ecommerce'),
                $title
            );
        }

        $fields = [
            'title' => $title,
            'slug' => $row['slug'],
            'status' => $status,
            'scheduled_at' => $status === ProductStatus::SCHEDULED ? $row['date_gmt'] : null,
            'description' => $row['content'] !== '' ? $row['content'] : null,
            'short_description' => $row['excerpt'] !== '' ? $row['excerpt'] : null,
            'brand_id' => $this->first_link('brand', $row['terms']['product_brand'] ?? [], $ledger),
            'categories' => $this->links('category', $row['terms']['product_cat'] ?? [], $ledger),
            'tags' => $this->links('tag', $row['terms']['product_tag'] ?? [], $ledger),
            'media' => $this->media($meta, $row['attachments']),
            'seo_title' => null,
            'seo_description' => null,
            'date_gmt' => $this->date($row['date_gmt']),
        ];

        $seo = $this->seo($meta);
        $fields['seo_title'] = $seo['title'];
        $fields['seo_description'] = $seo['description'];

        return $fields;
    }

    /**
     * Map a WooCommerce post status to a Kirki product status.
     *
     * @since 1.0.0
     *
     * @param string $status The post status.
     * @return string
     */
    protected function status(string $status)
    {
        if ($status === 'publish') {
            return ProductStatus::PUBLISHED;
        }

        if ($status === 'future') {
            return ProductStatus::SCHEDULED;
        }

        return ProductStatus::DRAFT;
    }

    /**
     * Read the SEO title and description from the installed SEO plugin.
     *
     * Titles that still hold template variables like "%%title%%" are not copied.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta The product meta.
     * @return array{title: string|null, description: string|null}
     */
    protected function seo(array $meta)
    {
        $title = null;
        $description = null;

        if ($this->has_yoast) {
            $title = $meta['_yoast_wpseo_title'] ?? null;
            $description = $meta['_yoast_wpseo_metadesc'] ?? null;
        }

        if ($this->has_rank_math) {
            $title = $title ?: ($meta['rank_math_title'] ?? null);
            $description = $description ?: ($meta['rank_math_description'] ?? null);
        }

        $clean = function ($value) {
            return is_string($value) && $value !== '' && strpos($value, '%') === false ? $value : null;
        };

        return ['title' => $clean($title), 'description' => $clean($description)];
    }

    /**
     * Collect the Kirki ids linked to a list of source terms.
     *
     * @since 1.0.0
     *
     * @param string                          $entity The record ledger entity.
     * @param array<int, array<string, mixed>> $terms  Source terms with an id.
     * @param RecordLedger                           $ledger The links between source and Kirki records.
     * @return int[]
     */
    protected function links(string $entity, array $terms, RecordLedger $ledger)
    {
        $ids = [];

        foreach ($terms as $term) {
            $kirki_ecommerce_id = $ledger->resolve($entity, (int) $term['id']);

            if ($kirki_ecommerce_id !== null) {
                $ids[] = $kirki_ecommerce_id;
            }
        }

        return $ids;
    }

    /**
     * Get the first Kirki id linked to a list of source terms.
     *
     * @since 1.0.0
     *
     * @param string                          $entity The record ledger entity.
     * @param array<int, array<string, mixed>> $terms  Source terms with an id.
     * @param RecordLedger                           $ledger The links between source and Kirki records.
     * @return int|null
     */
    protected function first_link(string $entity, array $terms, RecordLedger $ledger)
    {
        return $this->links($entity, $terms, $ledger)[0] ?? null;
    }

    /**
     * Get the product image ids that exist: the main image first, then the gallery.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta        The product meta.
     * @param int[]                $attachments The attachment ids that exist.
     * @return int[]
     */
    protected function media(array $meta, array $attachments)
    {
        $ids = [(int) ($meta['_thumbnail_id'] ?? 0)];

        foreach (explode(',', (string) ($meta['_product_image_gallery'] ?? '')) as $gallery_id) {
            $ids[] = (int) $gallery_id;
        }

        return array_values(array_unique(array_filter($ids, function ($id) use ($attachments) {
            return $id > 0 && in_array($id, $attachments, true);
        })));
    }

    /**
     * Describe the attributes that variations choose from.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $row The product row.
     * @return array<int, array<string, mixed>> Entries with key, taxonomy (or null), name and values.
     */
    protected function variation_attributes(array $row)
    {
        $defined = $row['meta']['_product_attributes'] ?? [];
        $attributes = [];

        if (!is_array($defined)) {
            return [];
        }

        foreach ($defined as $key => $attribute) {
            if (empty($attribute['is_variation'])) {
                continue;
            }

            $is_taxonomy = !empty($attribute['is_taxonomy']);
            $name = (string) ($attribute['name'] ?? $key);
            $values = [];

            if ($is_taxonomy) {
                foreach ($row['terms'][$name] ?? [] as $term) {
                    $values[] = ['term_id' => $term['id'], 'slug' => $term['slug'], 'name' => $term['name']];
                }
            } else {
                foreach (array_map('trim', explode('|', (string) ($attribute['value'] ?? ''))) as $value) {
                    if ($value !== '') {
                        $values[] = ['term_id' => null, 'slug' => sanitize_title($value), 'name' => $value];
                    }
                }
            }

            $attributes[] = [
                'key' => 'attribute_' . ($is_taxonomy ? $name : sanitize_title($name)),
                'taxonomy' => $is_taxonomy ? $name : null,
                'name' => $name,
                'values' => $values,
            ];
        }

        return $attributes;
    }

    /**
     * Map the variations of a variable product.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>             $row        The product row.
     * @param array<int, array<string, mixed>> $attributes The variation attributes.
     * @param string[]                         $notes      Notes to extend.
     * @return array<int, array<string, mixed>>
     */
    protected function variable_variants(array $row, array $attributes, array &$notes)
    {
        $variants = [];

        foreach ($row['variations'] as $index => $variation) {
            $choices = [];

            foreach ($attributes as $attribute) {
                $chosen = $variation['meta'][$attribute['key']] ?? '';

                if ($chosen === '') {
                    $notes[] = sprintf(
                        /* translators: 1: product title, 2: attribute name */
                        __('A variation of "%1$s" accepts any value of "%2$s". Kirki needs one value, so that attribute was left out of the variation.', 'kirki-ecommerce'),
                        $row['title'],
                        $attribute['name']
                    );

                    continue;
                }

                $choices[] = ['key' => $attribute['key'], 'value' => $chosen];
            }

            $variants[] = $this->variant($row['meta'], $variation, $row['attachments'], $index === 0, $variation['id'], $choices);
        }

        return $variants;
    }

    /**
     * Build the fields of one variant from a product, or from a variation that falls back to its parent.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed>             $parent_meta The parent product meta.
     * @param array<string, mixed>             $variation   The variation row; empty for a simple product.
     * @param int[]                            $attachments The attachment ids that exist.
     * @param bool                             $is_default  Whether this is the default variant.
     * @param int                              $source_id   The source post id.
     * @param array<int, array<string, string>> $choices     The attribute choices of a variation.
     * @return array<string, mixed>
     */
    protected function variant(array $parent_meta, array $variation, array $attachments, bool $is_default, int $source_id, array $choices = [])
    {
        $meta = $variation['meta'] ?? $parent_meta;
        $stock_meta = $this->stock_meta($meta, $parent_meta, !empty($variation));
        $sale_price = $this->sale_price($meta);
        $regular = $meta['_regular_price'] ?? '';
        $regular = $regular !== '' ? $regular : ($meta['_price'] ?? '');
        $weight = ($meta['_weight'] ?? '') !== '' ? $meta['_weight'] : ($parent_meta['_weight'] ?? '');
        $backorders = $stock_meta['_backorders'] ?? 'no';
        $sku = trim((string) ($meta['_sku'] ?? ''));
        $thumbnail = (int) ($meta['_thumbnail_id'] ?? 0);

        return [
            'source_id' => $source_id,
            'sku' => $sku !== '' ? $sku : null,
            'barcode' => ($meta['_global_unique_id'] ?? '') !== '' ? $meta['_global_unique_id'] : null,
            'base_price' => $regular !== '' ? Money::to_minor($regular) : 0,
            'base_sale_price' => $sale_price !== null ? Money::to_minor($sale_price) : null,
            'weight' => $weight !== '' ? (float) $weight : null,
            'weight_unit' => $weight !== '' ? $this->kirki_weight_unit() : null,
            'charge_taxes' => ($parent_meta['_tax_status'] ?? 'taxable') !== 'none',
            'allow_back_order' => in_array($backorders, ['yes', 'notify'], true),
            'track_inventory' => ($stock_meta['_manage_stock'] ?? 'no') === 'yes',
            'available_quantity' => max(0, (int) ($stock_meta['_stock'] ?? 0)),
            'in_stock' => ($stock_meta['_stock_status'] ?? 'instock') !== 'outofstock',
            'low_stock_threshold' => ($stock_meta['_low_stock_amount'] ?? '') !== '' ? (int) $stock_meta['_low_stock_amount'] : null,
            'has_limit_per_order' => ($parent_meta['_sold_individually'] ?? 'no') === 'yes',
            'max_per_order' => ($parent_meta['_sold_individually'] ?? 'no') === 'yes' ? 1 : null,
            'is_physical_product' => ($meta['_virtual'] ?? ($parent_meta['_virtual'] ?? 'no')) !== 'yes',
            'media' => $thumbnail > 0 && in_array($thumbnail, $attachments, true) ? $thumbnail : null,
            'is_default' => $is_default,
            'choices' => $choices,
        ];
    }

    /**
     * Get the meta that holds the stock settings. A variation that does not manage stock follows its parent when the parent manages it.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta        The variation or product meta.
     * @param array<string, mixed> $parent_meta The parent product meta.
     * @param bool                 $is_variation Whether the meta belongs to a variation.
     * @return array<string, mixed>
     */
    protected function stock_meta(array $meta, array $parent_meta, bool $is_variation)
    {
        if ($is_variation && ($meta['_manage_stock'] ?? 'no') !== 'yes' && ($parent_meta['_manage_stock'] ?? 'no') === 'yes') {
            return array_merge($parent_meta, ['_stock_status' => $meta['_stock_status'] ?? ($parent_meta['_stock_status'] ?? 'instock')]);
        }

        return $meta;
    }

    /**
     * Get the sale price when a sale is on now, or null.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $meta The variation or product meta.
     * @return string|null
     */
    protected function sale_price(array $meta)
    {
        $sale = $meta['_sale_price'] ?? '';

        if ($sale === '') {
            return null;
        }

        $from = (int) ($meta['_sale_price_dates_from'] ?? 0);
        $to = (int) ($meta['_sale_price_dates_to'] ?? 0);
        $now = Date::now()->get_timestamp();

        if (($from && $from > $now) || ($to && $to < $now)) {
            return null;
        }

        return $sale;
    }

    /**
     * Map the WooCommerce weight unit to a Kirki one.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function kirki_weight_unit()
    {
        $units = ['kg' => WeightUnit::KILOGRAM, 'g' => WeightUnit::GRAM, 'lbs' => WeightUnit::POUND, 'oz' => WeightUnit::OUNCE];

        return $units[$this->weight_unit] ?? WeightUnit::KILOGRAM;
    }

    /**
     * Turn a GMT date into a date, or null for the empty WordPress date.
     *
     * @since 1.0.0
     *
     * @param string|null $date The GMT date.
     * @return string|null
     */
    protected function date($date)
    {
        return $date && strpos((string) $date, '0000-00-00') !== 0 ? $date : null;
    }
}
