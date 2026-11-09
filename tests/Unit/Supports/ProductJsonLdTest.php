<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\ProductJsonLd;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class ProductJsonLdTest extends TestCase
{
    /**
     * @param array<int, array<string, mixed>> $items
     * @return array<string, mixed>
     */
    protected function seo(array $items = []): array
    {
        return [
            'title' => 'Wooden Lamp',
            'description' => 'Handmade.',
            'url' => 'https://example.test/shop/wooden-lamp',
            'site_name' => 'Droip Decor',
            'images' => ['https://example.test/a.jpg'],
            'offers' => ['currency' => 'USD', 'items' => $items],
        ];
    }

    /**
     * @param array<string, mixed> $overrides
     * @return array<string, mixed>
     */
    protected function item(array $overrides = []): array
    {
        return array_merge([
            'base_price' => '19.99',
            'base_strikethrough_price' => '',
            'availability' => 'InStock',
            'sku' => 'LMP-1',
            'barcode' => '',
            'is_default' => true,
        ], $overrides);
    }

    /**
     * @return array<string, mixed>
     */
    protected function product(): array
    {
        return [
            'brand' => ['name' => 'Droip', 'logo' => ['url' => 'https://example.test/logo.png']],
            'categories' => [
                ['id' => 1, 'name' => 'Lighting', 'parent_id' => null, 'level' => 0],
                ['id' => 2, 'name' => 'Lamps', 'parent_id' => 1, 'level' => 1],
            ],
        ];
    }

    public function test_every_field_with_data_is_printed()
    {
        $data = ProductJsonLd::build($this->seo([$this->item(['barcode' => '4006381333931'])]), $this->product());

        $this->assertSame('https://schema.org', $data['@context']);
        $this->assertSame('Product', $data['@type']);
        $this->assertSame('Wooden Lamp', $data['name']);
        $this->assertSame('Handmade.', $data['description']);
        $this->assertSame('https://example.test/a.jpg', $data['image']);
        $this->assertSame('LMP-1', $data['sku']);
        $this->assertSame('4006381333931', $data['gtin']);
        $this->assertSame('Lighting > Lamps', $data['category']);
        $this->assertSame(['@type' => 'Brand', 'name' => 'Droip', 'logo' => 'https://example.test/logo.png'], $data['brand']);
        $this->assertSame('https://example.test/shop/wooden-lamp', $data['url']);
    }

    public function test_single_variant_makes_an_offer_with_condition_and_seller()
    {
        $data = ProductJsonLd::build($this->seo([$this->item()]), $this->product());

        $this->assertSame('Offer', $data['offers']['@type']);
        $this->assertSame(19.99, $data['offers']['price']);
        $this->assertSame('USD', $data['offers']['priceCurrency']);
        $this->assertSame('https://schema.org/InStock', $data['offers']['availability']);
        $this->assertSame('https://schema.org/NewCondition', $data['offers']['itemCondition']);
        $this->assertSame(['@type' => 'Organization', 'name' => 'Droip Decor'], $data['offers']['seller']);
        $this->assertSame('https://example.test/shop/wooden-lamp', $data['offers']['url']);
    }

    public function test_empty_site_name_prints_no_seller()
    {
        $seo = $this->seo([$this->item()]);
        $seo['site_name'] = '';

        $data = ProductJsonLd::build($seo, $this->product());

        $this->assertArrayNotHasKey('seller', $data['offers']);
    }

    public function test_fields_without_data_are_left_out()
    {
        $seo = $this->seo([$this->item(['sku' => ''])]);
        $seo['images'] = [];
        $product = ['brand' => ['name' => 'Droip', 'logo' => null], 'categories' => []];

        $data = ProductJsonLd::build($seo, $product);

        $this->assertArrayNotHasKey('image', $data);
        $this->assertArrayNotHasKey('sku', $data);
        $this->assertArrayNotHasKey('gtin', $data);
        $this->assertArrayNotHasKey('category', $data);
        $this->assertSame(['@type' => 'Brand', 'name' => 'Droip'], $data['brand']);
    }

    public function test_product_without_brand_prints_no_brand()
    {
        $data = ProductJsonLd::build($this->seo([$this->item()]), ['categories' => []]);

        $this->assertArrayNotHasKey('brand', $data);
    }

    public function test_several_variants_make_an_aggregate_offer()
    {
        $data = ProductJsonLd::build(
            $this->seo([$this->item(['base_price' => '30.00']), $this->item(['base_price' => '9.50', 'availability' => 'OutOfStock', 'is_default' => false]), $this->item(['base_price' => '12.00', 'availability' => 'BackOrder', 'is_default' => false])]),
            $this->product()
        );

        $this->assertSame('AggregateOffer', $data['offers']['@type']);
        $this->assertSame(9.5, $data['offers']['lowPrice']);
        $this->assertSame(30.0, $data['offers']['highPrice']);
        $this->assertSame(3, $data['offers']['offerCount']);
        $this->assertSame('https://schema.org/InStock', $data['offers']['availability']);
    }

    public function test_variant_on_sale_prints_a_strikethrough_price()
    {
        $data = ProductJsonLd::build($this->seo([$this->item(['base_price' => '15.50', 'base_strikethrough_price' => '20.00'])]), $this->product());

        $this->assertSame(15.5, $data['offers']['price']);
        $this->assertSame([
            '@type' => 'UnitPriceSpecification',
            'priceType' => 'https://schema.org/StrikethroughPrice',
            'price' => 20.0,
            'priceCurrency' => 'USD',
        ], $data['offers']['priceSpecification']);
    }

    public function test_variant_not_on_sale_prints_no_strikethrough_price()
    {
        $data = ProductJsonLd::build($this->seo([$this->item()]), $this->product());

        $this->assertArrayNotHasKey('priceSpecification', $data['offers']);
    }

    public function test_aggregate_offer_prints_no_strikethrough_price()
    {
        $data = ProductJsonLd::build(
            $this->seo([$this->item(['base_price' => '25.00', 'base_strikethrough_price' => '40.00']), $this->item(['base_price' => '15.50', 'base_strikethrough_price' => '20.00', 'is_default' => false])]),
            $this->product()
        );

        $this->assertSame('AggregateOffer', $data['offers']['@type']);
        $this->assertArrayNotHasKey('priceSpecification', $data['offers']);
    }

    public function test_aggregate_availability_prefers_back_order_over_out_of_stock()
    {
        $data = ProductJsonLd::build(
            $this->seo([$this->item(['availability' => 'OutOfStock']), $this->item(['availability' => 'BackOrder', 'is_default' => false])]),
            $this->product()
        );

        $this->assertSame('https://schema.org/BackOrder', $data['offers']['availability']);
    }

    public function test_no_visible_variant_prints_no_offers()
    {
        $data = ProductJsonLd::build($this->seo([]), $this->product());

        $this->assertArrayNotHasKey('offers', $data);
    }

    public function test_gtin_prints_only_for_a_valid_barcode_length()
    {
        $valid = ProductJsonLd::build($this->seo([$this->item(['barcode' => '4006381333931'])]), $this->product());
        $invalid = ProductJsonLd::build($this->seo([$this->item(['barcode' => '12345'])]), $this->product());

        $this->assertSame('4006381333931', $valid['gtin']);
        $this->assertArrayNotHasKey('gtin', $invalid);
    }

    public function test_ratings_and_reviews_are_never_printed()
    {
        $data = ProductJsonLd::build($this->seo([$this->item()]), $this->product());

        $this->assertArrayNotHasKey('aggregateRating', $data);
        $this->assertArrayNotHasKey('review', $data);
    }

    public function test_text_cannot_close_the_script_tag_after_encoding()
    {
        $seo = $this->seo([$this->item()]);
        $seo['title'] = '</script><script>alert(1)</script>';
        $data = ProductJsonLd::build($seo, $this->product());

        $json = wp_json_encode($data, JSON_HEX_TAG | JSON_HEX_AMP | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);

        $this->assertStringNotContainsString('<', $json);
        $this->assertSame($seo['title'], json_decode($json, true)['name']);
    }
}
