<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\App\Constants\Product\AvailabilityStatus;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Route;

use function Kirki\Ecommerce\Framework\request;
use function Kirki\Ecommerce\Framework\view_data;

/**
 * Resolves the SEO, social and structured data values of a product page.
 *
 * Every head output (meta tags, Open Graph, Twitter Card and JSON-LD) reads from the
 * same resolved array, so the outputs never disagree.
 *
 * @since 1.0.0
 */
class ProductSeo
{
    const SCHEMA_URL = 'https://schema.org/';

    /**
     * Whether the SEO head output is switched on.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public static function is_enabled()
    {
        return (bool) apply_filters(DevHookNames::SEO_HEAD_ENABLED, true);
    }

    /**
     * Resolve the SEO data of the product page being rendered.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>|null The resolved data, or null outside the product page, without product data, or when the output is switched off.
     */
    public static function current()
    {
        if (!Route::is('shop.single') || !static::is_enabled()) {
            return null;
        }

        $product = view_data();

        if (empty($product) || empty($product['slug'])) {
            return null;
        }

        $data = static::resolve($product, [
            'site_name' => get_bloginfo('name'),
            'locale' => get_locale(),
            'url' => Url::get_product_url($product['slug']),
            'fallback_image' => Url::get_product_fallback_image(),
            'currency' => Money::get_base_currency(),
            'is_preview' => request()->bool('preview', false),
        ]);

        return apply_filters(DevHookNames::PRODUCT_SEO_DATA, $data, $product);
    }

    /**
     * Resolve the SEO data of a product from its resource array.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product The product resource array.
     * @param array<string, mixed> $context Site values: site_name, locale, url, fallback_image, currency, is_preview.
     * @return array<string, mixed> The resolved values.
     */
    public static function resolve(array $product, array $context)
    {
        $short_description = static::plain_text($product['short_description'] ?? '');
        $description = static::plain_text($product['seo_description'] ?? '');
        $description = $description !== '' ? $description : $short_description;

        $og_title = static::plain_text($product['og_title'] ?? '');
        $og_description = static::plain_text($product['og_description'] ?? '');
        $image = static::resolve_image($product, $context['fallback_image'] ?? '');
        $offers = static::resolve_offers($product, $context['currency'] ?? '');

        return [
            'title' => (string) ($product['title'] ?? ''),
            'description' => $description,
            'keywords' => array_values(array_filter((array) ($product['seo_keywords'] ?? []), 'strlen')),
            'url' => (string) ($context['url'] ?? ''),
            'site_name' => (string) ($context['site_name'] ?? ''),
            'locale' => (string) ($context['locale'] ?? ''),
            'og_title' => $og_title !== '' ? $og_title : (string) ($product['title'] ?? ''),
            'og_description' => $og_description !== '' ? $og_description : $short_description,
            'image' => $image,
            'images' => static::resolve_images($product, $image),
            'offers' => $offers,
            'indexable' => ($product['status'] ?? '') === ProductStatus::PUBLISHED && empty($context['is_preview']),
        ];
    }

    /**
     * Convert HTML into trimmed plain text with collapsed whitespace.
     *
     * @since 1.0.0
     *
     * @param mixed $html The HTML or text.
     * @return string
     */
    public static function plain_text($html)
    {
        if (!is_scalar($html)) {
            return '';
        }

        return trim((string) preg_replace('/\s+/', ' ', wp_strip_all_tags((string) $html)));
    }

    /**
     * Pick the social image: Open Graph image, featured image, then the store fallback.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product        The product resource array.
     * @param string               $fallback_image Store fallback image URL.
     * @return array{url: string, width: int, height: int}
     */
    protected static function resolve_image(array $product, string $fallback_image)
    {
        $media = (array) ($product['media'] ?? []);
        $candidates = [$product['og_image'] ?? null, $media[0] ?? null];

        foreach ($candidates as $candidate) {
            if (is_array($candidate) && !empty($candidate['url'])) {
                return [
                    'url' => (string) $candidate['url'],
                    'width' => (int) ($candidate['width'] ?? 0),
                    'height' => (int) ($candidate['height'] ?? 0),
                ];
            }
        }

        return ['url' => $fallback_image, 'width' => 0, 'height' => 0];
    }

    /**
     * List the image URLs of the product for structured data, or the social image when it has none.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product The product resource array.
     * @param array<string, mixed> $image   The resolved social image.
     * @return string[]
     */
    protected static function resolve_images(array $product, array $image)
    {
        $urls = [];

        foreach ((array) ($product['media'] ?? []) as $media) {
            if (is_array($media) && !empty($media['url'])) {
                $urls[] = (string) $media['url'];
            }
        }

        return $urls !== [] ? $urls : array_values(array_filter([$image['url']]));
    }

    /**
     * Build the sellable offers from the visible variants, in the store base currency.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $product  The product resource array.
     * @param string               $currency Store base currency code.
     * @return array{currency: string, items: array<int, array<string, mixed>>}
     */
    protected static function resolve_offers(array $product, string $currency)
    {
        $items = [];

        foreach ((array) ($product['variants'] ?? []) as $variant) {
            if (!is_array($variant) || empty($variant['is_visible'])) {
                continue;
            }

            $sale_amount = $variant['base_sale_price'] ?? null;
            $regular_amount = $variant['base_price'] ?? null;
            $amount = $sale_amount !== null ? $sale_amount : $regular_amount;

            if ($amount === null) {
                continue;
            }

            $is_on_sale = $sale_amount !== null && $regular_amount !== null && (float) $sale_amount < (float) $regular_amount;

            $items[] = [
                'base_price' => static::format_amount($amount, $currency),
                'base_strikethrough_price' => $is_on_sale ? static::format_amount($regular_amount, $currency) : '',
                'availability' => static::resolve_availability($variant),
                'sku' => (string) ($variant['sku'] ?? ''),
                'barcode' => (string) ($variant['barcode'] ?? ''),
                'is_default' => !empty($variant['is_default']),
            ];
        }

        return ['currency' => $currency, 'items' => $items];
    }

    /**
     * Format a major-unit amount as a plain decimal string using the currency's own decimal places.
     *
     * @since 1.0.0
     *
     * @param int|float|string $amount   The amount in major units.
     * @param string           $currency Currency code.
     * @return string
     */
    protected static function format_amount($amount, string $currency)
    {
        $minor = Money::to_minor($amount, $currency);

        return (string) Money::from_minor($minor, $currency)->getAmount();
    }

    /**
     * Map the stock state of a variant to a schema.org availability name.
     *
     * Any state that is not known to be sellable is out of stock, so search engines
     * are never told a product is available when we are not sure.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $variant The variant resource array.
     * @return string `InStock`, `BackOrder` or `OutOfStock`.
     */
    protected static function resolve_availability(array $variant)
    {
        $status = $variant['availability_status'] ?? '';

        if (in_array($status, [AvailabilityStatus::IN_STOCK, AvailabilityStatus::LOW_STOCK], true)) {
            return 'InStock';
        }

        if ($status === AvailabilityStatus::OUT_OF_STOCK && !empty($variant['allow_back_order'])) {
            return 'BackOrder';
        }

        return 'OutOfStock';
    }
}
