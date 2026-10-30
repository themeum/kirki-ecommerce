<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Payment\WebhookController;
use Kirki\Ecommerce\App\Supports\Icon;
use Kirki\Ecommerce\App\Supports\Template;
use Kirki\Ecommerce\Framework\Http\Request;
use ReflectionClass;
use WP_UnitTestCase;

use function Kirki\Ecommerce\Framework\app;

/**
 * Output that cannot be HTML-escaped as a plain string still goes through an
 * escaping or allow-list call, and valid markup and provider replies survive it.
 */
class EscapedOutputTest extends WP_UnitTestCase
{
    /**
     * Remove the provider that a test registered.
     *
     * @return void
     * @since 1.0.0
     */
    protected function tearDown(): void
    {
        $manager = app(PaymentManager::class);
        $registry = (new ReflectionClass($manager))->getProperty('providers_registry');
        $registry->setAccessible(true);
        $providers = $registry->getValue($manager);
        unset($providers['escaped-output-test']);
        $registry->setValue($manager, $providers);

        parent::tearDown();
    }

    /**
     * Call a protected static method of a class.
     *
     * @param class-string $class  Class name.
     * @param string       $method Method name.
     * @return mixed
     * @since 1.0.0
     */
    protected function call_protected(string $class, string $method)
    {
        $reflection = new ReflectionClass($class);
        $target = $reflection->getMethod($method);
        $target->setAccessible(true);

        return $target->invoke(null);
    }

    /**
     * Register a provider whose webhook returns the given flag.
     *
     * @param bool $success Flag the provider returns.
     * @return string Provider ID.
     * @since 1.0.0
     */
    protected function register_webhook_provider(bool $success): string
    {
        $provider = new class ($success) extends PaymentProvider {
            /** @var bool */
            protected $success;

            public function __construct(bool $success)
            {
                $this->success = $success;
            }

            public function id()
            {
                return 'escaped-output-test';
            }

            public function webhook()
            {
                return $this->success;
            }
        };

        $manager = app(PaymentManager::class);
        $registry = (new ReflectionClass($manager))->getProperty('providers_registry');
        $registry->setAccessible(true);
        $providers = $registry->getValue($manager);
        $providers['escaped-output-test'] = $provider;
        $registry->setValue($manager, $providers);

        return 'escaped-output-test';
    }

    /**
     * A bundled icon prints the same SVG that it loads.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_icon_render_keeps_the_bundled_svg(): void
    {
        $options = ['size' => 20, 'class' => 'kecom-icon'];

        ob_start();
        Icon::render('arrow-left', $options);
        $printed = ob_get_clean();

        $this->assertNotSame('', $printed);
        $this->assertSame(
            preg_replace('/\s+/', '', strtolower(Icon::get('arrow-left', $options))),
            preg_replace('/\s+/', '', strtolower($printed))
        );
    }

    /**
     * Block theme markup keeps what a header or footer needs and loses scripts.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_block_markup_keeps_navigation_form_and_svg_but_drops_scripts(): void
    {
        $markup = '<header class="wp-block-template-part"><nav class="wp-block-navigation" aria-label="Main">'
            . '<button aria-expanded="false" aria-haspopup="true" aria-controls="menu-1" data-wp-on--click="actions.toggle" class="wp-block-navigation__responsive-container-open">'
            . '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" aria-hidden="true" focusable="false"><path d="M5 5h14v2H5z" fill="currentColor"></path></svg></button>'
            . '<a href="/shop" class="wp-block-navigation-item__content">Shop</a></nav>'
            . '<form role="search" method="get" action="/" class="wp-block-search"><input type="search" name="s" placeholder="Search" class="wp-block-search__input"></form>'
            . '<img src="/logo.png" srcset="/logo.png 1x, /logo2.png 2x" sizes="100px" alt="Logo" class="custom-logo" loading="lazy"></header>';

        $allowed = $this->call_protected(Template::class, 'get_block_markup_allowed_html');
        $output = wp_kses($markup . '<script>alert(1)</script>', $allowed);

        foreach (['aria-expanded="false"', 'aria-controls="menu-1"', 'data-wp-on--click="actions.toggle"', 'viewbox="0 0 24 24"', 'd="M5 5h14v2H5z"', '<form', 'name="s"', 'srcset="/logo.png 1x, /logo2.png 2x"', 'class="wp-block-navigation"'] as $kept) {
            $this->assertStringContainsStringIgnoringCase($kept, $output);
        }

        $this->assertStringNotContainsString('<script', $output);
    }

    /**
     * Block theme markup loses event handler attributes.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_block_markup_drops_event_handlers(): void
    {
        $allowed = $this->call_protected(Template::class, 'get_block_markup_allowed_html');
        $output = wp_kses('<a href="/x" onclick="steal()">x</a><img src="/a.png" onerror="steal()">', $allowed);

        $this->assertStringNotContainsString('onclick', $output);
        $this->assertStringNotContainsString('onerror', $output);
    }

    /**
     * Core answers a webhook with the JSON envelope and never prints a raw body.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_webhook_answer_is_the_json_envelope(): void
    {
        remove_all_filters('rest_pre_serve_request');

        $ok = (new WebhookController())->handle(new Request(), $this->register_webhook_provider(true));
        $failed = (new WebhookController())->handle(new Request(), $this->register_webhook_provider(false));

        $this->assertFalse(has_filter('rest_pre_serve_request'));
        $this->assertSame(200, $ok->get_status());
        $this->assertSame(400, $failed->get_status());
    }

    /**
     * The 2Checkout add-on prints its read receipt unchanged and sends it as XML.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_twocheckout_prints_the_read_receipt_unchanged(): void
    {
        $file = dirname(__DIR__, 2) . '/payments/kirki-twocheckout/src/Twocheckout.php';

        if (!file_exists($file)) {
            $this->markTestSkipped('The 2Checkout add-on is not in this package.');
        }

        require_once $file;

        $class = 'Kirki\\Ecommerce\\Payments\\Twocheckout';
        $provider = (new ReflectionClass($class))->newInstanceWithoutConstructor();
        $send = new \ReflectionMethod($class, 'send_read_receipt');
        $send->setAccessible(true);

        foreach (['<sig algo="sha256" date="20260101120000">ABC123</sig>', '<EPAYMENT>20260101120000|ABC123</EPAYMENT>', ''] as $receipt) {
            remove_all_filters('rest_pre_serve_request');
            $send->invoke($provider, $receipt);

            set_error_handler(static function ($severity, $message) {
                return false !== strpos($message, 'headers already sent');
            });
            ob_start();
            $served = apply_filters('rest_pre_serve_request', false);
            $printed = (string) ob_get_clean();
            restore_error_handler();

            $this->assertTrue($served);
            $this->assertSame($receipt, $printed);
        }
    }
}
