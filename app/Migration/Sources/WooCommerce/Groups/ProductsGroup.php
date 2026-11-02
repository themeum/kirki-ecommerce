<?php

namespace Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Groups;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\DTO\Product\CreateProductDTO;
use Kirki\Ecommerce\App\DTO\Variant\CreateVariantDTO;
use Kirki\Ecommerce\App\Migration\Core\RecordLedger;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\AttributeResolver;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Mappers\ProductMapper;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Probe\ExtensionDetector;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\Readers\ProductReader;
use Kirki\Ecommerce\App\Migration\Sources\WooCommerce\WooCommerceDatabase;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\ProductService;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Framework\Supports\Str;
use Kirki\Ecommerce\App\Models\OrderItem;

use function Kirki\Ecommerce\Framework\app;

/**
 * Migrates WooCommerce products with their variations.
 *
 * A simple product becomes one product with one default variant. A variable product becomes one
 * product with a variant for each variation. The product and each variant are linked in the record ledger;
 * a simple product's default variant is linked under the product's own source id.
 *
 * @since 1.0.0
 */
class ProductsGroup extends WooCommerceGroup
{
    /** @var ExtensionDetector */
    protected $extensions;

    /** @var ProductReader */
    protected $reader;

    /**
     * Create the group.
     *
     * @since 1.0.0
     *
     * @param WooCommerceDatabase $database   The WooCommerce database reader.
     * @param ExtensionDetector   $extensions Tells which SEO plugin is installed.
     */
    public function __construct(WooCommerceDatabase $database, ExtensionDetector $extensions)
    {
        parent::__construct($database);

        $this->extensions = $extensions;
        $this->reader = new ProductReader($database);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function id()
    {
        return 'products';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function label()
    {
        return __('Products', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function description()
    {
        return __('Simple and variable products with their variants, prices, stock and images.', 'kirki-ecommerce');
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function depends_on()
    {
        return ['settings', 'categories', 'tags', 'brands', 'attributes'];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function chunk_size()
    {
        return 30;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function count()
    {
        return $this->database->count_products();
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function entity()
    {
        return 'product';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fetch(int $cursor, int $limit)
    {
        return $this->reader->products($cursor, $limit);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function map(array $row, RecordLedger $ledger)
    {
        $mapper = new ProductMapper(
            $this->extensions->has('wordpress-seo'),
            $this->extensions->has('seo-by-rank-math'),
            (string) get_option('woocommerce_weight_unit', 'kg')
        );

        return $mapper->map($row, $ledger);
    }

    /**
     * Create the product and its variants and link them.
     *
     * This follows the product create action, but runs inside the transaction of the row, so it
     * calls the services and not the action.
     *
     * @since 1.0.0
     *
     * @inheritDoc
     */
    protected function persist($mapped, array $row, RecordLedger $ledger)
    {
        foreach ($mapped['notes'] as $note) {
            $this->note($note);
        }

        $resolver = new AttributeResolver($ledger, $this->run_id);
        $attributes = [];
        $value_ids = [];

        foreach ($mapped['attributes'] as $attribute) {
            $attribute_id = $resolver->attribute_id($attribute);
            $ids = [];

            foreach ($attribute['values'] as $value) {
                $value_id = $resolver->value_id($attribute_id, $value);
                $ids[] = $value_id;
                $value_ids[$attribute['key']][sanitize_title($value['slug'])] = $value_id;
                $value_ids[$attribute['key']][sanitize_title($value['name'])] = $value_id;
            }

            $attributes[] = ['id' => $attribute_id, 'values' => $ids];
        }

        $fields = $mapped['product'];
        $variants = $mapped['variants'];

        if (empty($attributes) && count($variants) > 1) {
            $this->note(sprintf(
                /* translators: %s: product title */
                __('Product "%s" has several variations without usable attributes. Only the first variation was migrated.', 'kirki-ecommerce'),
                $fields['title']
            ));
            $variants = [$variants[0]];
        }

        $product_dto = new CreateProductDTO([
            'title' => $fields['title'],
            'slug' => $fields['slug'],
            'status' => $fields['status'],
            'scheduled_at' => $fields['scheduled_at'],
            'description' => $fields['description'],
            'short_description' => $fields['short_description'],
            'seo_title' => $fields['seo_title'],
            'seo_description' => $fields['seo_description'],
            'brand_id' => $fields['brand_id'],
            'has_variants' => !empty($attributes),
            'media' => $fields['media'],
            'categories' => $fields['categories'],
            'tags' => $fields['tags'],
            'attributes' => $attributes,
        ]);

        $product = app(ProductService::class)->create($product_dto);

        $this->note_slug_change($fields['title'], Str::slug((string) $fields['slug']), $product->slug);
        $this->restore_dates((int) $product->id, $fields);

        $variant_service = app(VariantService::class);
        $used_skus = [];

        foreach ($variants as $variant) {
            $variant_dto = new CreateVariantDTO([
                'product_id' => $product->id,
                'media' => $variant['media'],
                'attribute_values' => $this->variant_value_ids($variant['choices'], $value_ids, $resolver, $mapped['attributes'], $attributes),
                'sku' => $this->unique_sku($variant['sku'], $used_skus, $fields['title']),
                'barcode' => $variant['barcode'],
                'base_price' => $variant['base_price'],
                'base_sale_price' => $variant['base_sale_price'],
                'weight' => $variant['weight'],
                'weight_unit' => $variant['weight_unit'],
                'charge_taxes' => $variant['charge_taxes'],
                'allow_back_order' => $variant['allow_back_order'],
                'track_inventory' => $variant['track_inventory'],
                'available_quantity' => $variant['available_quantity'],
                'in_stock' => $variant['in_stock'],
                'low_stock_threshold' => $variant['low_stock_threshold'],
                'has_limit_per_order' => $variant['has_limit_per_order'],
                'max_per_order' => $variant['max_per_order'],
                'is_physical_product' => $variant['is_physical_product'],
                'is_default' => $variant['is_default'],
            ]);

            $created = $variant_service->create($variant_dto);
            $ledger->link('variant', (int) $variant['source_id'], (int) $created->id, $this->run_id);
        }

        return (int) $product->id;
    }

    /**
     * Turn the attribute choices of a variation into Kirki attribute value ids.
     *
     * @since 1.0.0
     *
     * @param array<int, array<string, string>> $choices     The variation choices: attribute key and chosen value.
     * @param array<string, array<string, int>> $value_ids   The value ids found, by attribute key then slug.
     * @param AttributeResolver                 $resolver    Creates a missing value.
     * @param array<int, array<string, mixed>>  $described   The mapped attributes.
     * @param array<int, array<string, mixed>>  $resolved    The resolved attributes with their Kirki ids.
     * @return int[]
     */
    protected function variant_value_ids(array $choices, array $value_ids, AttributeResolver $resolver, array $described, array $resolved)
    {
        $ids = [];

        foreach ($choices as $choice) {
            $slug = sanitize_title($choice['value']);

            if (isset($value_ids[$choice['key']][$slug])) {
                $ids[] = $value_ids[$choice['key']][$slug];
                continue;
            }

            foreach ($described as $index => $attribute) {
                if ($attribute['key'] === $choice['key']) {
                    $ids[] = $resolver->value_id($resolved[$index]['id'], ['term_id' => null, 'name' => $choice['value']]);
                }
            }
        }

        return array_values(array_unique($ids));
    }

    /**
     * Give a variant a SKU that no other variant uses.
     *
     * @since 1.0.0
     *
     * @param string|null $sku        The SKU in WooCommerce.
     * @param string[]    $used_skus  SKUs used by earlier variants of the same product, which the method extends.
     * @param string      $title      The product title, for the note.
     * @return string|null
     */
    protected function unique_sku($sku, array &$used_skus, string $title)
    {
        if ($sku === null) {
            return null;
        }

        $candidate = $sku;
        $suffix = 1;

        while (in_array($candidate, $used_skus, true) || Variant::query()->where('sku', $candidate)->first()) {
            $suffix++;
            $candidate = $sku . '-' . $suffix;
        }

        $used_skus[] = $candidate;

        if ($candidate !== $sku) {
            $this->note(sprintf(
                /* translators: 1: product title, 2: SKU in WooCommerce, 3: SKU saved in Kirki */
                __('The SKU "%2$s" of "%1$s" was already used, so it was saved as "%3$s".', 'kirki-ecommerce'),
                $title,
                $sku,
                $candidate
            ));
        }

        return $candidate;
    }

    /**
     * Record a note when the product slug was changed because it was already used.
     *
     * @since 1.0.0
     *
     * @param string $title  The product title.
     * @param string $wanted The slug in WooCommerce.
     * @param string $saved  The slug that was saved.
     * @return void
     */
    protected function note_slug_change(string $title, string $wanted, string $saved)
    {
        if ($wanted !== '' && $wanted !== $saved) {
            $this->note(sprintf(
                /* translators: 1: product title, 2: new slug */
                __('Product "%1$s" was saved with the slug "%2$s" because its slug was already used.', 'kirki-ecommerce'),
                $title,
                $saved
            ));
        }
    }

    /**
     * Put the original creation and publish dates back on the product.
     *
     * The model sets the creation date to now on insert, so the original date is set by a direct update.
     *
     * @since 1.0.0
     *
     * @param int                  $product_id The Kirki product id.
     * @param array<string, mixed> $fields     The mapped product fields.
     * @return void
     */
    protected function restore_dates(int $product_id, array $fields)
    {
        if (empty($fields['date_gmt'])) {
            return;
        }

        $dates = ['created_at' => $fields['date_gmt']];

        if ($fields['status'] === 'published') {
            $dates['published_at'] = $fields['date_gmt'];
        }

        Product::query()->where('id', $product_id)->update($dates);
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function ledger_entities()
    {
        return ['product', 'variant'];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function revert_record(string $entity, int $kirki_ecommerce_id, $previous_value = null)
    {
        if ($entity === 'variant') {
            return $this->remove_record(Variant::class, $kirki_ecommerce_id, OrderItem::query()->where('variant_id', $kirki_ecommerce_id)->exists());
        }

        return $this->remove_record(Product::class, $kirki_ecommerce_id, OrderItem::query()->where('product_id', $kirki_ecommerce_id)->exists());
    }
}
