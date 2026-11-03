<?php

/**
 * Add WP Head Meta Data
 *
 * @package Kirki\Ecommerce\App\Hooks\Actions
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Actions;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Supports\ProductJsonLd;
use Kirki\Ecommerce\App\Supports\ProductSeo;
use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Prints SEO, Open Graph, Twitter Card and structured data tags for the single product page on wp_head.
 *
 * @since 1.0.0
 */
class AddWpHeadMeta extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return WPHookNames::WP_HEAD;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    /**
     * Echo the description, canonical, Open Graph, Twitter Card and JSON-LD tags of the product being viewed.
     *
     * Does nothing outside the single product route or when the SEO head output is switched off.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments, unused.
     * @return void
     */
    public function handle(...$args)
    {
        $seo = ProductSeo::current();

        if ($seo === null) {
            return;
        }

        $this->print_search_tags($seo);
        $this->print_social_tags($seo);
        $this->print_structured_data(ProductJsonLd::current($seo));
    }

    /**
     * Echo the description, keywords and canonical tags.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $seo The resolved SEO data.
     * @return void
     */
    protected function print_search_tags(array $seo)
    {
        $this->meta('name', 'description', $seo['description']);
        $this->meta('name', 'keywords', implode(', ', $seo['keywords']));

        printf("<link rel=\"canonical\" href=\"%s\">\n", esc_url($seo['url']));
    }

    /**
     * Echo the Open Graph, product price and Twitter Card tags.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $seo The resolved SEO data.
     * @return void
     */
    protected function print_social_tags(array $seo)
    {
        $image = $seo['image'];
        $prices = array_column($seo['offers']['items'], 'base_price');

        $this->meta('property', 'og:type', 'product');
        $this->meta('property', 'og:url', $seo['url'], true);
        $this->meta('property', 'og:site_name', $seo['site_name']);
        $this->meta('property', 'og:locale', $seo['locale']);
        $this->meta('property', 'og:title', $seo['og_title']);
        $this->meta('property', 'og:description', $seo['og_description']);
        $this->meta('property', 'og:image', $image['url'], true);

        if ($image['width'] > 0 && $image['height'] > 0) {
            $this->meta('property', 'og:image:width', (string) $image['width']);
            $this->meta('property', 'og:image:height', (string) $image['height']);
        }

        if ($prices !== []) {
            usort($prices, function ($first, $second) {
                return (float) $first <=> (float) $second;
            });

            $this->meta('property', 'product:price:amount', $prices[0]);
            $this->meta('property', 'product:price:currency', $seo['offers']['currency']);
        }

        $this->meta('name', 'twitter:card', $image['url'] !== '' ? 'summary_large_image' : 'summary');
        $this->meta('name', 'twitter:title', $seo['og_title']);
        $this->meta('name', 'twitter:description', $seo['og_description']);
        $this->meta('name', 'twitter:image', $image['url'], true);
    }

    /**
     * Echo the JSON-LD script.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data The structured data.
     * @return void
     */
    protected function print_structured_data(array $data)
    {
        if (empty($data)) {
            return;
        }

        $json = wp_json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- JSON with < > & hex-escaped, so values cannot close the script tag.
        echo '<script type="application/ld+json">' . $json . "</script>\n";
    }

    /**
     * Echo one meta tag, skipping it when the value is empty.
     *
     * @since 1.0.0
     *
     * @param string $attribute Attribute that names the tag: `name` or `property`.
     * @param string $key       Tag name.
     * @param string $content   Tag value.
     * @param bool   $is_url    Whether the value is a URL.
     * @return void
     */
    protected function meta(string $attribute, string $key, string $content, bool $is_url = false)
    {
        if ($content === '') {
            return;
        }

        printf(
            "<meta %s=\"%s\" content=\"%s\">\n",
            esc_attr($attribute),
            esc_attr($key),
            $is_url ? esc_url($content) : esc_attr($content)
        );
    }
}
