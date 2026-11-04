<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Managers\MoneyManager;
use Kirki\Ecommerce\App\Supports\ProductSeo;
use Kirki\Ecommerce\Tests\Unit\TestCase;

use function Kirki\Ecommerce\Framework\app;

class ProductSeoTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies();
        app()->alias('money', MoneyManager::class);
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    protected function product(array $overrides = []): array
    {
        return array_merge([
            'title' => 'Wooden Lamp',
            'slug' => 'wooden-lamp',
            'status' => 'published',
            'short_description' => '<p>Handmade   from <b>teak</b>.</p>',
            'seo_title' => 'Buy Wooden Lamp',
            'seo_description' => '',
            'seo_keywords' => [],
            'og_title' => '',
            'og_description' => '',
            'og_image' => null,
            'media' => [],
            'variants' => [],
        ], $overrides);
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    protected function context(array $overrides = []): array
    {
        return array_merge([
            'site_name' => 'Droip Decor',
            'locale' => 'en_US',
            'url' => 'https://example.test/shop/wooden-lamp',
            'fallback_image' => 'https://example.test/fallback.webp',
            'currency' => 'USD',
            'is_preview' => false,
        ], $overrides);
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    protected function variant(array $overrides = []): array
    {
        return array_merge([
            'is_visible' => true,
            'is_default' => true,
            'base_price' => 19.99,
            'base_sale_price' => null,
            'availability_status' => 'in_stock',
            'allow_back_order' => false,
            'sku' => 'LMP-1',
            'barcode' => '',
        ], $overrides);
    }

    public function test_meta_description_uses_seo_description_then_plain_short_description()
    {
        $with_seo = ProductSeo::resolve($this->product(['seo_description' => 'Search text']), $this->context());
        $without = ProductSeo::resolve($this->product(), $this->context());

        $this->assertSame('Search text', $with_seo['description']);
        $this->assertSame('Handmade from teak.', $without['description']);
    }

    public function test_og_values_fall_back_to_product_values_not_seo_values()
    {
        $data = ProductSeo::resolve($this->product(), $this->context());

        $this->assertSame('Wooden Lamp', $data['og_title']);
        $this->assertSame('Handmade from teak.', $data['og_description']);

        $set = ProductSeo::resolve($this->product(['og_title' => 'Shared', 'og_description' => 'Shared text']), $this->context());

        $this->assertSame('Shared', $set['og_title']);
        $this->assertSame('Shared text', $set['og_description']);
    }

    public function test_image_uses_og_image_then_featured_image_then_fallback()
    {
        $og = ['url' => 'https://example.test/og.jpg', 'width' => 1200, 'height' => 630];
        $featured = ['url' => 'https://example.test/featured.jpg', 'width' => 800, 'height' => 800];

        $from_og = ProductSeo::resolve($this->product(['og_image' => $og, 'media' => [$featured]]), $this->context());
        $from_media = ProductSeo::resolve($this->product(['media' => [$featured]]), $this->context());
        $from_fallback = ProductSeo::resolve($this->product(), $this->context());

        $this->assertSame($og, $from_og['image']);
        $this->assertSame('https://example.test/featured.jpg', $from_media['image']['url']);
        $this->assertSame(800, $from_media['image']['width']);
        $this->assertSame(['url' => 'https://example.test/fallback.webp', 'width' => 0, 'height' => 0], $from_fallback['image']);
    }

    public function test_indexable_only_when_published_and_not_preview()
    {
        $this->assertTrue(ProductSeo::resolve($this->product(), $this->context())['indexable']);
        $this->assertFalse(ProductSeo::resolve($this->product(['status' => 'draft']), $this->context())['indexable']);
        $this->assertFalse(ProductSeo::resolve($this->product(), $this->context(['is_preview' => true]))['indexable']);
    }

    public function test_offers_use_sale_price_and_skip_hidden_variants()
    {
        $data = ProductSeo::resolve($this->product(['variants' => [
            $this->variant(['base_price' => 20, 'base_sale_price' => 15.5]),
            $this->variant(['is_visible' => false, 'base_price' => 1]),
            $this->variant(['is_default' => false, 'base_price' => 30]),
        ]]), $this->context());

        $this->assertSame('USD', $data['offers']['currency']);
        $this->assertSame(['15.50', '30.00'], array_column($data['offers']['items'], 'base_price'));
    }

    public function test_price_uses_the_currency_decimal_places()
    {
        $data = ProductSeo::resolve($this->product(['variants' => [$this->variant(['base_price' => 1500])]]), $this->context(['currency' => 'JPY']));

        $this->assertSame('1500', $data['offers']['items'][0]['base_price']);
    }

    /**
     * @dataProvider availability_cases
     */
    public function test_availability_mapping(string $status, bool $allow_back_order, string $expected)
    {
        $data = ProductSeo::resolve($this->product(['variants' => [
            $this->variant(['availability_status' => $status, 'allow_back_order' => $allow_back_order]),
        ]]), $this->context());

        $this->assertSame($expected, $data['offers']['items'][0]['availability']);
    }

    /**
     * @return array<string, array{string, bool, string}>
     */
    public function availability_cases(): array
    {
        return [
            'in stock' => ['in_stock', false, 'InStock'],
            'low stock' => ['low_stock', false, 'InStock'],
            'out of stock' => ['out_of_stock', false, 'OutOfStock'],
            'back order' => ['out_of_stock', true, 'BackOrder'],
            'unknown status' => ['something_new', true, 'OutOfStock'],
        ];
    }
}
