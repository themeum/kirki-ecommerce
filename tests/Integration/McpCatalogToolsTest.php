<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\App\Mcp\Tools\FindProductsTool;
use Kirki\Ecommerce\App\Mcp\Tools\StockLevelsTool;
use Kirki\Ecommerce\App\Models\Product;
use Kirki\Ecommerce\App\Models\Variant;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Support\CreatesTestProducts;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 6.6: the find-products and stock-levels MCP tools.
 *
 * Spec: mcp-catalog-tools.
 */
class McpCatalogToolsTest extends RestTestCase
{
    use CreatesTestProducts;
    use SeedsAnalyticsData;

    /**
     * Start every test from an empty catalog with a store default threshold of 5.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_analytics_state();
        Variant::query()->delete();
        Product::query()->delete();
        Settings::get('product')->set(['low_stock_threshold' => 5], false);
    }

    /**
     * Run a tool and get its structured content.
     *
     * @param string $tool      Tool class.
     * @param array  $arguments Tool arguments.
     *
     * @return array
     * @since 1.0.0
     */
    protected function call(string $tool, array $arguments = []): array
    {
        $response = app()->make($tool)->handle(new Request($arguments));

        $this->assertSame('structured', $response->kind());

        return $response->content();
    }

    /**
     * Run a tool and get the validation errors it throws.
     *
     * @param string $tool      Tool class.
     * @param array  $arguments Tool arguments.
     *
     * @return array<string, string[]>
     * @since 1.0.0
     */
    protected function validation_errors(string $tool, array $arguments): array
    {
        try {
            $this->call($tool, $arguments);
        } catch (ValidationException $exception) {
            return $exception->get_errors();
        }

        $this->fail('The tool did not reject the arguments.');
    }

    /**
     * Create a product whose only variant has the given stock.
     *
     * @param string $title     Product title.
     * @param int    $quantity  Available quantity of the variant.
     * @param array  $overrides Product payload overrides.
     *
     * @return int The product ID.
     * @since 1.0.0
     */
    protected function make_product(string $title, int $quantity, array $overrides = []): int
    {
        $product_id = $this->create_product(array_merge(['title' => $title], $overrides))['id'];
        Variant::query()->where('product_id', $product_id)->update(['track_inventory' => true, 'available_quantity' => $quantity, 'in_stock' => $quantity > 0, 'low_stock_threshold' => null]);

        return $product_id;
    }

    /**
     * Scenario "Out-of-stock published products": only published products that are out of stock match.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_out_of_stock_published_products(): void
    {
        $empty = $this->make_product('Empty mug', 0, ['status' => 'published']);
        $this->make_product('Full mug', 50, ['status' => 'published']);
        $this->make_product('Draft mug', 0, ['status' => 'draft']);

        $result = $this->call(FindProductsTool::class, ['status' => 'published', 'availability_status' => 'out_of_stock']);

        $this->assertSame([$empty], array_column($result['products'], 'product_id'));
        $this->assertSame('out_of_stock', $result['products'][0]['availability_status']);
        $this->assertSame(1, $result['pagination']['total']);
    }

    /**
     * Scenario "Trashed products are hidden by default", and the row fields.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_trashed_products_are_hidden_by_default(): void
    {
        $category_id = $this->create_category('Mugs');
        $kept = $this->make_product('Kept mug', 7, ['categories' => [$category_id]]);
        $trashed = $this->make_product('Old mug', 7);
        Product::query()->where('id', $trashed)->update(['status' => 'trashed']);

        $result = $this->call(FindProductsTool::class);
        $row = $result['products'][0];

        $this->assertSame([$kept], array_column($result['products'], 'product_id'));
        $this->assertSame('Kept mug', $row['title']);
        $this->assertSame(['Mugs'], $row['categories']);
        $this->assertSame(1, $row['variant_count']);
        $this->assertSame(7, $row['tracked_quantity']);
        $this->assertSame(['amount', 'display', 'currency'], array_keys($row['price_range']['min']));
        $this->assertSame([$trashed], array_column($this->call(FindProductsTool::class, ['status' => 'trashed'])['products'], 'product_id'));
    }

    /**
     * Search by title, and the argument errors of find-products.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_find_products_search_and_validation(): void
    {
        $hoodie = $this->make_product('Blue hoodie', 3);
        $this->make_product('Red mug', 3);

        $this->assertSame([$hoodie], array_column($this->call(FindProductsTool::class, ['search' => 'hoodie'])['products'], 'product_id'));
        $this->assertArrayHasKey('per_page', $this->validation_errors(FindProductsTool::class, ['per_page' => 500]));
        $this->assertArrayHasKey('status', $this->validation_errors(FindProductsTool::class, ['status' => 'archived']));
        $this->assertArrayHasKey('availability_status', $this->validation_errors(FindProductsTool::class, ['availability_status' => 'empty']));
    }

    /**
     * Scenario "Full low-stock list": 9 low-stock variants, lowest first, and the counts match the Inventory health card.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_full_low_stock_list(): void
    {
        for ($index = 1; $index <= 9; $index++) {
            $this->make_product('Low ' . $index, ($index % 5) + 1);
        }

        $this->make_product('Plenty', 40);

        $result = $this->call(StockLevelsTool::class, ['status' => 'low_stock']);
        $card = $this->metric('inventory_health', [])['data'];
        $quantities = array_column($result['variants'], 'available_quantity');

        $this->assertCount(9, $result['variants']);
        $sorted = $quantities;
        sort($sorted);
        $this->assertSame($sorted, $quantities);
        $this->assertSame(['out_of_stock' => $card['out_of_stock'], 'low_stock' => $card['low_stock'], 'in_stock' => $card['in_stock']], $result['counts']);
        $this->assertSame(['page' => 1, 'per_page' => 20, 'total' => 9, 'total_pages' => 1], $result['pagination']);
        $this->assertSame('low_stock', $result['variants'][0]['status']);
        $this->assertArrayHasKey('sku', $result['variants'][0]);
    }

    /**
     * Scenario "Variant threshold overrides the store default": threshold 10 and 8 in stock is low stock.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_variant_threshold_overrides_the_store_default(): void
    {
        $product_id = $this->make_product('Override', 8);
        Variant::query()->where('product_id', $product_id)->update(['low_stock_threshold' => 10]);

        $variant = $this->call(StockLevelsTool::class)['variants'][0];

        $this->assertSame($product_id, $variant['product_id']);
        $this->assertSame('low_stock', $variant['status']);
        $this->assertSame(10, $variant['low_stock_threshold']);
    }

    /**
     * Scenario "Unknown status" of stock-levels.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_stock_levels_unknown_status(): void
    {
        $this->assertArrayHasKey('status', $this->validation_errors(StockLevelsTool::class, ['status' => 'empty']));
    }
}
