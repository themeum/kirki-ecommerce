<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\Product\ProductStatus;
use Kirki\Ecommerce\App\Jobs\PublishScheduledProductJob;
use Kirki\Ecommerce\App\Mcp\Tools\AdjustStockTool;
use Kirki\Ecommerce\App\Mcp\Tools\ChangeProductStatusTool;
use Kirki\Ecommerce\App\Mcp\Tools\CreateDraftProductTool;
use Kirki\Ecommerce\App\Mcp\Tools\DuplicateProductTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdatePricesTool;
use Kirki\Ecommerce\App\Mcp\Tools\UpdateProductContentTool;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Services\VariantService;
use Kirki\Ecommerce\Framework\Queue\QueueFake;
use Kirki\Ecommerce\Framework\Queue\QueueManager;
use Kirki\Ecommerce\Framework\Supports\Facades\Queue;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\RunsWriteTools;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers tasks 4.1, 4.2 and 4.10: the catalog write tools and the narrow product and variant writes.
 *
 * Spec: mcp-catalog-write-tools, and mcp-write-tool-conventions for the annotations.
 */
class McpCatalogWriteToolsTest extends RestTestCase
{
    use CreatesTestProducts;
    use RunsWriteTools;

    /** @var QueueFake */
    protected $queue;

    /**
     * Start every test with an administrator, a base currency and a fake queue.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->login_as_admin();
        $this->seed_base_currency();
        $this->queue = Queue::fake();
    }

    /**
     * Drop the faked queue manager so later tests resolve a real one.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        static::forget_singleton(QueueManager::class);

        parent::tearDown();
    }

    /**
     * Run a call that must do the change.
     *
     * @param string $tool      Tool class.
     * @param array  $arguments Tool arguments.
     *
     * @return array
     * @since 1.0.0
     */
    protected function done(string $tool, array $arguments): array
    {
        $response = $this->run_tool($tool, $arguments);

        $this->assertFalse($response->is_error(), (string) json_encode($response->content()));
        $this->assertSame('done', $response->content()['status']);

        return $response->content();
    }

    /**
     * Create a product with one tracked variant.
     *
     * @param array $variant Variant overrides.
     * @param array $product Product overrides.
     *
     * @return array Product data from the API.
     * @since 1.0.0
     */
    protected function product(array $variant = [], array $product = []): array
    {
        return $this->create_product(array_merge([
            'title' => 'Linen shirt',
            'variants' => [array_merge([
                'base_price' => 50,
                'sku' => 'SKU-' . wp_generate_password(6, false),
                'available_quantity' => 6,
                'track_inventory' => true,
                'in_stock' => true,
                'is_default' => true,
                'attribute_values' => [],
            ], $variant)],
        ], $product));
    }

    /**
     * Annotations and _meta of the 6 catalog tools.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_annotations(): void
    {
        foreach ([UpdateProductContentTool::class, ChangeProductStatusTool::class, AdjustStockTool::class, UpdatePricesTool::class] as $class) {
            $this->assertTrue(app()->make($class)->destructive(), $class);
            $this->assertFalse(app()->make($class)->open_world(), $class);
            $this->assertTrue(app()->make($class)->requires_confirmation(), $class);
        }

        foreach ([CreateDraftProductTool::class, DuplicateProductTool::class] as $class) {
            $this->assertFalse(app()->make($class)->destructive(), $class);
            $this->assertFalse(app()->make($class)->requires_confirmation(), $class);
        }

        $this->assertSame(['anthropic/requiresUserInteraction' => true], app()->make(UpdatePricesTool::class)->meta());
        $this->assertSame([], app()->make(AdjustStockTool::class)->meta());
    }

    /**
     * Scenario "New description": only the description changes.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_new_description(): void
    {
        $product = $this->product([], ['short_description' => 'Old short text', 'description' => 'Old text']);

        $preview = $this->preview(UpdateProductContentTool::class, ['product_id' => $product['id'], 'description' => 'Soft linen, made in Portugal.']);
        $this->assertSame(['current' => 'Old text', 'new' => 'Soft linen, made in Portugal.'], $preview['changes']['fields']['description']);

        $done = $this->confirm(UpdateProductContentTool::class, ['product_id' => $product['id'], 'description' => 'Soft linen, made in Portugal.']);

        $stored = Product::with('variants')->find($product['id']);
        $this->assertSame('Soft linen, made in Portugal.', $done['fields']['description']);
        $this->assertSame('Soft linen, made in Portugal.', $stored->description);
        $this->assertSame('Old short text', $stored->short_description);
        $this->assertSame('Linen shirt', $stored->title);
        $this->assertCount(1, $stored->variants->all());
    }

    /**
     * Scenario "No field".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_content_needs_a_field(): void
    {
        $product = $this->product();

        $errors = $this->errors(UpdateProductContentTool::class, ['product_id' => $product['id']]);

        $this->assertStringContainsString('description', $errors['product_id'][0]);
    }

    /**
     * Scenarios "Simple product" and "Status is ignored".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_simple_draft_product(): void
    {
        $category_id = $this->create_category('Shirts');

        $done = $this->done(CreateDraftProductTool::class, [
            'title' => 'Linen shirt',
            'status' => 'published',
            'base_price' => 49,
            'available_quantity' => 20,
            'track_inventory' => true,
            'category_ids' => [$category_id],
        ]);

        $product = Product::with('variants', 'categories')->find($done['product']['product_id']);
        $this->assertSame(ProductStatus::DRAFT, $product->status);
        $this->assertCount(1, $product->variants->all());
        $this->assertSame(4900, (int) $product->variants->first()->base_price);
        $this->assertSame(20, (int) $product->variants->first()->available_quantity);
        $this->assertSame([$category_id], array_map('intval', $product->categories->pluck('id')->to_array()));
        $this->assertStringContainsString('#/products/' . $product->id, $done['product']['admin_edit_url']);
    }

    /**
     * Scenario "Product with variants".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_draft_product_with_variants(): void
    {
        $attribute = $this->assert_api_success($this->request('POST', 'attributes', ['name' => 'Size', 'slug' => 'size-' . wp_generate_password(4, false), 'type' => 'list']), 201)['data'];
        $values = [];

        foreach (['S', 'M', 'L'] as $size) {
            $values[] = (int) $this->assert_api_success($this->request('POST', 'attributes/' . $attribute['id'] . '/values', ['attribute_id' => $attribute['id'], 'value' => $size]), 201)['data']['id'];
        }

        $done = $this->done(CreateDraftProductTool::class, [
            'title' => 'Linen shirt',
            'attributes' => [['id' => $attribute['id'], 'values' => $values]],
            'variants' => array_map(function ($value_id) {
                return ['attribute_values' => [$value_id], 'base_price' => 49];
            }, $values),
        ]);

        $this->assertCount(3, $done['product']['variants']);
        $this->assertSame(ProductStatus::DRAFT, $done['product']['status']);
    }

    /**
     * A sale price above the price, too many decimals and an unknown category are rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_draft_product_rejections(): void
    {
        $this->assertArrayHasKey('base_sale_price', $this->errors(CreateDraftProductTool::class, ['title' => 'Shirt', 'base_price' => 50, 'base_sale_price' => 60]));
        $this->assertArrayHasKey('base_price', $this->errors(CreateDraftProductTool::class, ['title' => 'Shirt', 'base_price' => '19.999']));
        $this->assertArrayHasKey('category_ids', $this->errors(CreateDraftProductTool::class, ['title' => 'Shirt', 'category_ids' => [999999]]));
        $this->assertSame(0, Product::query()->where('title', 'Shirt')->count());
    }

    /**
     * Scenario "Copy".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_duplicate_product(): void
    {
        $product = $this->product();

        $done = $this->done(DuplicateProductTool::class, ['product_id' => $product['id']]);

        $this->assertNotSame($product['id'], $done['product']['product_id']);
        $this->assertSame(ProductStatus::DRAFT, $done['product']['status']);
        $this->assertSame($product['id'], $done['source_product_id']);
    }

    /**
     * Scenario "Publish".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_publish(): void
    {
        $product = $this->product([], ['status' => ProductStatus::DRAFT]);

        $done = $this->confirm(ChangeProductStatusTool::class, ['product_id' => $product['id'], 'status' => ProductStatus::PUBLISHED]);

        $stored = Product::query()->find($product['id']);
        $this->assertSame(ProductStatus::PUBLISHED, $done['product']['status']);
        $this->assertNotEmpty($stored->published_at);
    }

    /**
     * Scenario "Schedule in the past", a future schedule, and publishing a product without a price.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_schedule(): void
    {
        $product = $this->product([], ['status' => ProductStatus::DRAFT]);

        $past = gmdate(DATE_ATOM, time() - DAY_IN_SECONDS);
        $this->assertArrayHasKey('scheduled_at', $this->errors(ChangeProductStatusTool::class, ['product_id' => $product['id'], 'status' => ProductStatus::SCHEDULED, 'scheduled_at' => $past]));

        $future = gmdate(DATE_ATOM, time() + DAY_IN_SECONDS);
        $done = $this->confirm(ChangeProductStatusTool::class, ['product_id' => $product['id'], 'status' => ProductStatus::SCHEDULED, 'scheduled_at' => $future]);

        $this->assertSame(ProductStatus::SCHEDULED, $done['product']['status']);
        $this->assertNotEmpty($done['product']['scheduled_at']);
        $this->assertCount(1, $this->queue->pushed(PublishScheduledProductJob::class));

        Variant::query()->where('product_id', $product['id'])->update(['base_price' => 0]);
        $this->assertArrayHasKey('status', $this->errors(ChangeProductStatusTool::class, ['product_id' => $product['id'], 'status' => ProductStatus::PUBLISHED]));
    }

    /**
     * Scenario "Trash": the product is trashed the same way as the admin bulk trash, and can come back as a draft.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_trash_and_restore(): void
    {
        $product = $this->product();

        $this->confirm(ChangeProductStatusTool::class, ['product_id' => $product['id'], 'status' => ProductStatus::TRASHED]);

        $stored = Product::query()->find($product['id']);
        $this->assertSame(ProductStatus::TRASHED, $stored->status);
        $this->assertNotEmpty($stored->trashed_at);
        $this->assertEmpty($stored->published_at);

        $this->confirm(ChangeProductStatusTool::class, ['product_id' => $product['id'], 'status' => ProductStatus::DRAFT]);

        $stored = Product::query()->find($product['id']);
        $this->assertSame(ProductStatus::DRAFT, $stored->status);
        $this->assertEmpty($stored->trashed_at);
    }

    /**
     * Scenario "Delivery arrived".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_delivery_arrived(): void
    {
        $variant_id = $this->default_variant_id($this->product());

        $preview = $this->preview(AdjustStockTool::class, ['variant_id' => $variant_id, 'quantity_change' => 24, 'expected_quantity' => 6]);
        $this->assertSame(['current' => 6, 'new' => 30], $preview['changes']['available_quantity']);

        $done = $this->confirm(AdjustStockTool::class, ['variant_id' => $variant_id, 'quantity_change' => 24, 'expected_quantity' => 6]);

        $this->assertSame(30, $done['variant']['available_quantity']);
    }

    /**
     * Scenario "Stock changed": an order takes 1 unit after the preview.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_stock_changed_after_the_preview(): void
    {
        $variant_id = $this->default_variant_id($this->product());
        $arguments = ['variant_id' => $variant_id, 'quantity_change' => 24, 'expected_quantity' => 6];
        $preview = $this->preview(AdjustStockTool::class, $arguments);

        app()->make(VariantService::class)->decrement_available($variant_id, 1, true);

        $response = $this->run_tool(AdjustStockTool::class, $arguments + ['confirmation_token' => $preview['confirmation_token']]);

        $this->assertTrue($response->is_error());
        $this->assertSame(5, (int) Variant::query()->find($variant_id)->available_quantity);
    }

    /**
     * Scenario "Below zero", a wrong expected quantity and a variant that does not track inventory.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_stock_rejections(): void
    {
        $variant_id = $this->default_variant_id($this->product());

        $this->assertArrayHasKey('quantity_change', $this->errors(AdjustStockTool::class, ['variant_id' => $variant_id, 'quantity_change' => -10, 'expected_quantity' => 6]));
        $this->assertArrayHasKey('expected_quantity', $this->errors(AdjustStockTool::class, ['variant_id' => $variant_id, 'quantity_change' => 1, 'expected_quantity' => 7]));
        $this->assertArrayHasKey('quantity_change', $this->errors(AdjustStockTool::class, ['variant_id' => $variant_id, 'quantity_change' => 0, 'expected_quantity' => 6]));

        Variant::query()->where('id', $variant_id)->update(['track_inventory' => 0]);
        $this->assertArrayHasKey('variant_id', $this->errors(AdjustStockTool::class, ['variant_id' => $variant_id, 'quantity_change' => 1, 'expected_quantity' => 6]));
    }

    /**
     * The relative stock change matches only the expected quantity of a tracked variant, and never goes below 0.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_adjust_available_conditions(): void
    {
        $variant_id = $this->default_variant_id($this->product());
        $service = app()->make(VariantService::class);

        $this->assertFalse($service->adjust_available($variant_id, 5, 7));
        $this->assertFalse($service->adjust_available($variant_id, -7, 6));
        $this->assertTrue($service->adjust_available($variant_id, -6, 6));
        $this->assertSame(0, (int) Variant::query()->find($variant_id)->available_quantity);

        Variant::query()->where('id', $variant_id)->update(['track_inventory' => 0]);
        $this->assertFalse($service->adjust_available($variant_id, 5, 0));
    }

    /**
     * Scenario "Summer sale".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_summer_sale(): void
    {
        $first = $this->default_variant_id($this->product());
        $second = $this->default_variant_id($this->product(['base_price' => 80]));
        $arguments = ['variants' => [['variant_id' => $first, 'base_sale_price' => 40], ['variant_id' => $second, 'base_sale_price' => 60.5]]];

        $preview = $this->preview(UpdatePricesTool::class, $arguments);
        $this->assertSame(40.0, (float) $preview['changes']['variants'][0]['base_sale_price']['new']['amount']);

        $done = $this->confirm(UpdatePricesTool::class, $arguments);

        $this->assertSame(4000, (int) Variant::query()->find($first)->base_sale_price);
        $this->assertSame(6050, (int) Variant::query()->find($second)->base_sale_price);
        $this->assertSame(60.5, $done['variants'][1]['base_sale_price']['amount']);
        $this->assertSame(8000, (int) Variant::query()->find($second)->base_price);
    }

    /**
     * Scenarios "Sale price over the price" and "Too many variants".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_price_rejections(): void
    {
        $variant_id = $this->default_variant_id($this->product());

        $this->assertArrayHasKey('variants.0.base_sale_price', $this->errors(UpdatePricesTool::class, ['variants' => [['variant_id' => $variant_id, 'base_sale_price' => 60]]]));

        $many = array_fill(0, 101, ['variant_id' => $variant_id, 'base_price' => 1]);
        $this->assertArrayHasKey('variants', $this->errors(UpdatePricesTool::class, ['variants' => $many]));

        $this->assertSame(5000, (int) Variant::query()->find($variant_id)->base_price);
    }
}
