<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\App\Mcp\Tools\FindCustomersTool;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Support\RestTestCase;
use Kirki\Ecommerce\Tests\Support\SeedsAnalyticsData;

use function Kirki\Ecommerce\Framework\app;

/**
 * Covers task 6.6: the find-customers MCP tool.
 *
 * Spec: mcp-customer-tools, mcp-read-tool-conventions (masking, money shape).
 */
class McpCustomerToolsTest extends RestTestCase
{
    use SeedsAnalyticsData;

    /**
     * Start every test from an empty store.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        $this->reset_analytics_state();
        Address::query()->delete();
    }

    /**
     * Run the tool and get its structured content.
     *
     * @param array $arguments Tool arguments.
     *
     * @return array
     * @since 1.0.0
     */
    protected function call(array $arguments = []): array
    {
        $response = app()->make(FindCustomersTool::class)->handle(new Request($arguments));

        $this->assertSame('structured', $response->kind());

        return $response->content();
    }

    /**
     * Create a customer with a default shipping address and paid orders.
     *
     * @param string $first_name First name.
     * @param string $email      Email.
     * @param string $country    Country of the default shipping address.
     * @param int[]  $totals     Paid order totals in minor units.
     *
     * @return Customer
     * @since 1.0.0
     */
    protected function make_customer(string $first_name, string $email, string $country, array $totals = []): Customer
    {
        $customer = Customer::create(['first_name' => $first_name, 'last_name' => 'Doe', 'email' => $email, 'phone' => '+15550100', 'accepts_marketing' => true]);
        Address::create([
            'customer_id' => $customer->id,
            'first_name' => $first_name,
            'last_name' => 'Doe',
            'address_line1' => '1 Main Street',
            'city' => 'Berlin',
            'country' => $country,
            'postal_code' => '10115',
            'is_default_shipping' => true,
            'is_default_billing' => true,
        ]);

        foreach ($totals as $total) {
            $this->make_sale('2026-10-01 10:00:00', $total, ['customer_id' => $customer->id, 'customer_email' => $email]);
        }

        return $customer;
    }

    /**
     * Scenario "Best customers first": sort by total spent puts the highest spender first.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_best_customers_first(): void
    {
        $this->make_customer('Ann', 'ann@example.com', 'US', [1000]);
        $top = $this->make_customer('Bob', 'bob@example.com', 'US', [5000, 7050]);

        $result = $this->call(['sort_by' => 'base_amount_spent']);
        $row = $result['customers'][0];

        $this->assertSame($top->id, $row['customer_id']);
        $this->assertSame(['amount' => 120.5, 'display' => '$120.50', 'currency' => 'USD'], $row['base_amount_spent']);
        $this->assertSame(2, $row['orders_count']);
        $this->assertNotNull($row['last_order_date']);
    }

    /**
     * Scenario "Customers in one country": only customers whose default shipping address is in Germany.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_customers_in_one_country(): void
    {
        $german = $this->make_customer('Greta', 'greta@example.com', 'DE');
        $this->make_customer('Sam', 'sam@example.com', 'US');

        $result = $this->call(['country' => 'de']);

        $this->assertSame([$german->id], array_column($result['customers'], 'customer_id'));
        $this->assertSame('DE', $result['customers'][0]['country']);
    }

    /**
     * Scenario "Masked data" and "Search by full email": the email is masked, the first name only, and no phone number.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_masked_data_and_search_by_full_email(): void
    {
        $this->make_customer('Jane', 'jane@example.com', 'US');
        $this->make_customer('Max', 'max@example.com', 'US');

        $result = $this->call(['search' => 'jane@example.com']);
        $encoded = wp_json_encode($result);

        $this->assertCount(1, $result['customers']);
        $this->assertSame('j***@example.com', $result['customers'][0]['email']);
        $this->assertSame('Jane', $result['customers'][0]['first_name']);
        $this->assertTrue($result['customers'][0]['accepts_marketing']);
        $this->assertStringNotContainsString('15550100', $encoded);
        $this->assertStringNotContainsString('Main Street', $encoded);
        $this->assertStringNotContainsString('Doe', $encoded);
        $this->assertStringNotContainsString('jane@example.com', $encoded);
    }

    /**
     * The argument errors of find-customers.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_validation(): void
    {
        foreach ([['sort_by' => 'email'], ['country' => 'Germany'], ['per_page' => 101]] as $arguments) {
            try {
                $this->call($arguments);
                $this->fail('The tool did not reject ' . wp_json_encode($arguments));
            } catch (ValidationException $exception) {
                $this->assertArrayHasKey(array_key_first($arguments), $exception->get_errors());
            }
        }
    }
}
