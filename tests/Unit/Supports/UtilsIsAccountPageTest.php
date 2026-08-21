<?php

/**
 * Because Utils lives in the Kirki\Ecommerce\App\Supports namespace,
 * PHP will resolve the unqualified `get_permalink()` call to THIS
 * namespace-level function BEFORE falling back to the global one.
 */

namespace Kirki\Ecommerce\App\Supports;

/**
 * Stub for get_permalink() inside the Utils namespace.
 * The test sets $GLOBALS['__test_permalink'] to control the return value.
 *
 * @param int $post_id Post ID.
 *
 * @return string
 */
function get_permalink($post_id = 0)
{
    return $GLOBALS['__test_permalink'] ?? 'http://example.com/account';
}

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Tests\Unit\TestCase;

/**
 * Thin subclass that overrides get_account_page_id() so the
 * Settings facade (and its container binding) is never touched.
 *
 * Because Utils::is_account_page() uses late-static binding
 * (`static::get_account_page_id()`), calling TestableUtils::is_account_page()
 * will resolve to the overridden method below.
 *
 * @since 1.0.0
 */
class TestableUtils extends Utils
{
    /** @var int */
    public static $fake_account_page_id = 42;

    public static function get_account_page_id()
    {
        return static::$fake_account_page_id;
    }
}

/**
 * Class UtilsIsAccountPageTest
 *
 * Run the testcase by running this command:
 * vendor/bin/phpunit --testsuite=Unit --filter=UtilsIsAccountPageTest --testdox
 */
//phpcs:ignore
class UtilsIsAccountPageTest extends TestCase
{
    /**
     * Back up the original REQUEST_URI so we can restore it.
     *
     * @var string|null
     */
    private $original_request_uri;

    protected function setUp(): void
    {
        parent::setUp();
        $this->original_request_uri = $_SERVER['REQUEST_URI'] ?? null;

        // Default: account page exists and its permalink is /account.
        TestableUtils::$fake_account_page_id = 42;
        $GLOBALS['__test_permalink'] = 'http://example.com/account';
    }

    protected function tearDown(): void
    {
        if ($this->original_request_uri !== null) {
            $_SERVER['REQUEST_URI'] = $this->original_request_uri;
        } else {
            unset($_SERVER['REQUEST_URI']);
        }

        unset($GLOBALS['__test_permalink']);

        parent::tearDown();
    }

    // ------------------------------------------------------------------
    //  No account page configured
    // ------------------------------------------------------------------

    public function test_returns_false_when_no_account_page_configured(): void
    {
        TestableUtils::$fake_account_page_id = 0;
        $_SERVER['REQUEST_URI'] = '/account';

        $this->assertFalse(TestableUtils::is_account_page());
    }

    // ------------------------------------------------------------------
    //  No sub-path (detect ANY account page)
    // ------------------------------------------------------------------

    public function test_matches_account_root(): void
    {
        $_SERVER['REQUEST_URI'] = '/account';

        $this->assertTrue(TestableUtils::is_account_page());
    }

    public function test_matches_account_root_with_trailing_slash(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/';

        $this->assertTrue(TestableUtils::is_account_page());
    }

    public function test_matches_account_sub_page(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders';

        $this->assertTrue(TestableUtils::is_account_page());
    }

    public function test_matches_deeply_nested_account_page(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders/abc-123/details';

        $this->assertTrue(TestableUtils::is_account_page());
    }

    public function test_does_not_match_unrelated_page(): void
    {
        $_SERVER['REQUEST_URI'] = '/shop/products';

        $this->assertFalse(TestableUtils::is_account_page());
    }

    public function test_does_not_match_partial_prefix(): void
    {
        $_SERVER['REQUEST_URI'] = '/account-settings';

        $this->assertFalse(TestableUtils::is_account_page());
    }

    // ------------------------------------------------------------------
    //  Exact sub-path matching
    // ------------------------------------------------------------------

    public function test_exact_sub_path_matches(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders';

        $this->assertTrue(TestableUtils::is_account_page('orders'));
    }

    public function test_exact_sub_path_does_not_match_different_path(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/addresses';

        $this->assertFalse(TestableUtils::is_account_page('orders'));
    }

    public function test_exact_sub_path_does_not_match_deeper_path(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders/abc-123';

        $this->assertFalse(TestableUtils::is_account_page('orders'));
    }

    public function test_multi_segment_sub_path(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders/details';

        $this->assertTrue(TestableUtils::is_account_page('orders/details'));
    }

    public function test_sub_path_strips_leading_and_trailing_slashes(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders';

        $this->assertTrue(TestableUtils::is_account_page('/orders/'));
    }

    // ------------------------------------------------------------------
    //  Wildcard matching
    // ------------------------------------------------------------------

    public function test_wildcard_matches_single_segment(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders/abc-123';

        $this->assertTrue(TestableUtils::is_account_page('orders/*'));
    }

    public function test_wildcard_matches_multiple_segments(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders/abc-123/details';

        $this->assertTrue(TestableUtils::is_account_page('orders/*'));
    }

    public function test_wildcard_does_not_match_parent(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders';

        $this->assertFalse(TestableUtils::is_account_page('orders/*'));
    }

    public function test_wildcard_in_middle_segment(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders/abc-123/detail';

        $this->assertTrue(TestableUtils::is_account_page('orders/*/detail'));
    }

    public function test_wildcard_in_middle_does_not_match_wrong_suffix(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders/abc-123/edit';

        $this->assertFalse(TestableUtils::is_account_page('orders/*/detail'));
    }

    // ------------------------------------------------------------------
    //  Query strings
    // ------------------------------------------------------------------

    public function test_ignores_query_string(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders?page=2&sort=date';

        $this->assertTrue(TestableUtils::is_account_page('orders'));
    }

    public function test_wildcard_ignores_query_string(): void
    {
        $_SERVER['REQUEST_URI'] = '/account/orders/abc-123?view=summary';

        $this->assertTrue(TestableUtils::is_account_page('orders/*'));
    }

    // ------------------------------------------------------------------
    //  Custom account page slug
    // ------------------------------------------------------------------

    public function test_works_with_custom_account_slug(): void
    {
        $GLOBALS['__test_permalink'] = 'http://example.com/my-account';
        $_SERVER['REQUEST_URI'] = '/my-account/orders';

        $this->assertTrue(TestableUtils::is_account_page('orders'));
    }

    public function test_custom_slug_no_match_on_old_slug(): void
    {
        $GLOBALS['__test_permalink'] = 'http://example.com/my-account';
        $_SERVER['REQUEST_URI'] = '/account/orders';

        $this->assertFalse(TestableUtils::is_account_page('orders'));
    }

    // ------------------------------------------------------------------
    //  Subdirectory install
    // ------------------------------------------------------------------

    public function test_works_with_subdirectory_install(): void
    {
        $GLOBALS['__test_permalink'] = 'http://example.com/shop/account';
        $_SERVER['REQUEST_URI'] = '/shop/account/manage';

        $this->assertTrue(TestableUtils::is_account_page('manage'));
    }

    public function test_subdirectory_no_arg_matches_root(): void
    {
        $GLOBALS['__test_permalink'] = 'http://example.com/shop/account';
        $_SERVER['REQUEST_URI'] = '/shop/account';

        $this->assertTrue(TestableUtils::is_account_page());
    }
}
