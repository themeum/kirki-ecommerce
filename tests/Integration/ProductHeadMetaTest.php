<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Hooks\DevHookNames;
use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Hooks\Actions\AddWpHeadMeta;
use Kirki\Ecommerce\App\Hooks\Filters\AddProductRobots;
use Kirki\Ecommerce\App\Hooks\Filters\ReplaceSiteTitle;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Resources\Product\ProductResource;
use Kirki\Ecommerce\App\Supports\Url;
use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Routing\CurrentRoute;
use Kirki\Ecommerce\Framework\View\ViewContext;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * The single product page prints SEO, Open Graph, Twitter Card and JSON-LD tags in the head.
 */
class ProductHeadMetaTest extends RestTestCase
{
    use CreatesTestProducts;

    public function tear_down(): void
    {
        CurrentRoute::reset();
        app(ViewContext::class)->clear();
        unset($_GET['preview']);
        remove_all_filters(DevHookNames::SEO_HEAD_ENABLED);
        remove_all_filters(DevHookNames::PRODUCT_SEO_DATA);
        remove_all_filters(DevHookNames::PRODUCT_JSON_LD);

        parent::tear_down();
    }

    /**
     * Create a product and make the head hooks see it as the rendered product page.
     *
     * @param array<string, mixed> $overrides Product payload overrides.
     * @return array<string, mixed> The product resource array.
     */
    protected function visit_product(array $overrides = []): array
    {
        $created = $this->create_product(array_merge(['title' => 'Wooden Lamp', 'short_description' => '<p>Handmade teak lamp.</p>'], $overrides));
        $product = Product::with(['brand', 'currency', 'categories', 'tags', 'collections', 'attributes', 'attribute_values', 'variants.attribute_values', 'media'])
            ->where('slug', $created['slug'])
            ->first();
        $data = ProductResource::make($product);

        CurrentRoute::set('shop.single', ['slug' => $created['slug']]);
        app(ViewContext::class)->push(['template' => 'site.shop.single', 'route_name' => 'shop.single', 'resolved_path' => __FILE__, 'data' => $data]);

        return $data;
    }

    protected function head(): string
    {
        ob_start();
        (new AddWpHeadMeta())->handle();

        return (string) ob_get_clean();
    }

    protected function json_ld(string $head): array
    {
        $this->assertSame(1, preg_match('#<script type="application/ld\+json">(.*?)</script>#s', $head, $matches));

        return json_decode($matches[1], true);
    }

    protected function robots(): array
    {
        return (new AddProductRobots())->handle([]);
    }

    protected function create_attachment(): int
    {
        $id = static::factory()->attachment->create_object('lamp.jpg', 0, ['post_mime_type' => 'image/jpeg']);
        update_post_meta($id, '_wp_attached_file', 'lamp.jpg');
        wp_update_attachment_metadata($id, ['width' => 1200, 'height' => 630, 'file' => 'lamp.jpg', 'sizes' => []]);

        return $id;
    }

    public function test_prints_nothing_outside_the_product_page()
    {
        $this->visit_product();
        CurrentRoute::reset();

        $this->assertSame('', $this->head());
        $this->assertSame([], $this->robots());
    }

    public function test_prints_description_keywords_and_a_single_clean_canonical()
    {
        $product = $this->visit_product(['seo_description' => 'Search text', 'seo_keywords' => ['lamp', 'teak']]);
        $_GET['preview'] = '1';
        app()->instance('request', Request::capture());

        ob_start();
        do_action(WPHookNames::WP_HEAD);
        $head = (string) ob_get_clean();

        $this->assertStringContainsString('<meta name="description" content="Search text">', $head);
        $this->assertStringContainsString('<meta name="keywords" content="lamp, teak">', $head);
        $this->assertSame(1, substr_count($head, 'rel="canonical"'));
        $this->assertStringContainsString('<link rel="canonical" href="' . esc_url(Url::get_product_url($product['slug'])) . '">', $head);
        $this->assertSame(1, substr_count($head, 'property="og:title"'));
    }

    public function test_description_falls_back_to_the_plain_short_description()
    {
        $this->visit_product();

        $this->assertStringContainsString('<meta name="description" content="Handmade teak lamp.">', $this->head());
    }

    public function test_open_graph_tags_use_product_values_and_the_fallback_image()
    {
        $product = $this->visit_product(['seo_title' => 'Buy Wooden Lamp']);
        $head = $this->head();

        $this->assertStringContainsString('<meta property="og:type" content="product">', $head);
        $this->assertStringContainsString('<meta property="og:url" content="' . esc_url(Url::get_product_url($product['slug'])) . '">', $head);
        $this->assertStringContainsString('<meta property="og:site_name" content="' . esc_attr(get_bloginfo('name')) . '">', $head);
        $this->assertStringContainsString('<meta property="og:locale" content="' . esc_attr(get_locale()) . '">', $head);
        $this->assertStringContainsString('<meta property="og:title" content="Wooden Lamp">', $head);
        $this->assertStringContainsString('<meta property="og:description" content="Handmade teak lamp.">', $head);
        $this->assertStringContainsString('<meta property="og:image" content="' . esc_url(Url::get_product_fallback_image()) . '">', $head);
        $this->assertStringContainsString('<meta property="product:price:amount" content="29.99">', $head);
        $this->assertStringContainsString('<meta property="product:price:currency" content="USD">', $head);
    }

    public function test_open_graph_image_is_the_featured_image_url_with_size()
    {
        $this->visit_product(['media' => [$this->create_attachment()]]);
        $head = $this->head();

        $this->assertMatchesRegularExpression('#<meta property="og:image" content="https?://[^"]+lamp\.jpg">#', $head);
        $this->assertStringContainsString('<meta property="og:image:width" content="1200">', $head);
        $this->assertStringContainsString('<meta property="og:image:height" content="630">', $head);
        $this->assertStringNotContainsString('Array', $head);
        $this->assertStringContainsString('<meta name="twitter:card" content="summary_large_image">', $head);
        $this->assertMatchesRegularExpression('#<meta name="twitter:image" content="https?://[^"]+lamp\.jpg">#', $head);
    }

    public function test_og_values_set_by_the_merchant_win()
    {
        $this->visit_product(['og_title' => 'Shared title', 'og_description' => 'Shared text']);
        $head = $this->head();

        $this->assertStringContainsString('<meta property="og:title" content="Shared title">', $head);
        $this->assertStringContainsString('<meta name="twitter:title" content="Shared title">', $head);
        $this->assertStringContainsString('<meta property="og:description" content="Shared text">', $head);
    }

    public function test_tag_values_are_escaped()
    {
        $this->visit_product(['og_title' => '5 < 6 & "best"']);
        $head = $this->head();

        $this->assertStringContainsString('<meta property="og:title" content="5 &lt; 6 &amp; &quot;best&quot;">', $head);
    }

    public function test_json_ld_prints_the_fixed_field_set_from_product_data()
    {
        $product = $this->visit_product([
            'brand_id' => $this->create_brand('Teak Works'),
            'categories' => [$this->create_category('Lamps')],
            'variants' => [['base_price' => 29.99, 'sku' => 'LMP-1', 'available_quantity' => 5, 'in_stock' => true, 'is_default' => true, 'attribute_values' => []]],
        ]);
        $data = $this->json_ld($this->head());
        $url = Url::get_product_url($product['slug']);

        $this->assertSame('Product', $data['@type']);
        $this->assertSame('Wooden Lamp', $data['name']);
        $this->assertSame('Handmade teak lamp.', $data['description']);
        $this->assertSame('LMP-1', $data['sku']);
        $this->assertSame('Lamps', $data['category']);
        $this->assertSame('Teak Works', $data['brand']['name']);
        $this->assertSame($url, $data['url']);
        $this->assertSame('Offer', $data['offers']['@type']);
        $this->assertSame(29.99, $data['offers']['price']);
        $this->assertSame('USD', $data['offers']['priceCurrency']);
        $this->assertSame('https://schema.org/InStock', $data['offers']['availability']);
        $this->assertSame('https://schema.org/NewCondition', $data['offers']['itemCondition']);
        $this->assertSame($url, $data['offers']['url']);
        $this->assertSame(['@type' => 'Organization', 'name' => get_bloginfo('name')], $data['offers']['seller']);
        $this->assertArrayNotHasKey('priceSpecification', $data['offers']);
        $this->assertArrayNotHasKey('gtin', $data);
        $this->assertArrayNotHasKey('aggregateRating', $data);
        $this->assertArrayNotHasKey('review', $data);
    }

    public function test_script_closing_text_cannot_break_out_of_json_ld()
    {
        $this->visit_product();
        add_filter(DevHookNames::PRODUCT_SEO_DATA, function ($data) {
            $data['title'] = '</script><script>alert(1)</script>';

            return $data;
        });
        $head = $this->head();

        $this->assertSame(1, substr_count($head, '</script>'));
        $this->assertSame('</script><script>alert(1)</script>', $this->json_ld($head)['name']);
    }

    public function test_robots_adds_noindex_for_unpublished_products_and_previews()
    {
        $this->visit_product(['status' => ProductStatus::DRAFT]);
        $this->assertTrue($this->robots()['noindex']);
        app(ViewContext::class)->clear();

        $this->visit_product();
        $this->assertArrayNotHasKey('noindex', $this->robots());

        $_GET['preview'] = '1';
        app()->instance('request', Request::capture());
        $this->assertTrue($this->robots()['noindex']);
    }

    public function test_the_robots_filter_is_registered_on_wp_robots()
    {
        $this->visit_product(['status' => ProductStatus::DRAFT]);

        $this->assertTrue(apply_filters(WPHookNames::WP_ROBOTS, [])['noindex']);
    }

    public function test_disable_filter_switches_off_all_output()
    {
        $this->visit_product(['status' => ProductStatus::DRAFT]);
        add_filter(DevHookNames::SEO_HEAD_ENABLED, '__return_false');

        $this->assertSame('', $this->head());
        $this->assertSame([], $this->robots());
    }

    public function test_data_and_json_ld_filters_change_the_output()
    {
        $this->visit_product();
        add_filter(DevHookNames::PRODUCT_SEO_DATA, function ($data) {
            $data['og_title'] = 'Filtered title';

            return $data;
        });
        add_filter(DevHookNames::PRODUCT_JSON_LD, function ($data) {
            $data['mpn'] = 'MPN-9';

            return $data;
        });
        $head = $this->head();

        $this->assertStringContainsString('<meta property="og:title" content="Filtered title">', $head);
        $this->assertSame('MPN-9', $this->json_ld($head)['mpn']);
    }

    public function test_document_title_uses_the_seo_title_or_the_product_title_and_site_name()
    {
        $this->visit_product(['seo_title' => 'Buy Wooden Lamp']);
        $this->assertSame('Buy Wooden Lamp', (new ReplaceSiteTitle())->handle(''));
        app(ViewContext::class)->clear();

        $this->visit_product();
        $this->assertSame('Wooden Lamp - ' . get_bloginfo('name'), (new ReplaceSiteTitle())->handle(''));
    }
}
