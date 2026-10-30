<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Payment\WebhookController;
use Kirki\Ecommerce\App\Payment\WebhookResult;
use Kirki\Ecommerce\App\Supports\HtmlStyle;
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
     * Register a provider whose webhook returns the given result.
     *
     * @param WebhookResult $result Result the provider returns.
     * @return string Provider ID.
     * @since 1.0.0
     */
    protected function register_webhook_provider(WebhookResult $result): string
    {
        $provider = new class ($result) extends PaymentProvider {
            /** @var WebhookResult */
            protected $result;

            public function __construct(WebhookResult $result)
            {
                $this->result = $result;
            }

            public function id()
            {
                return 'escaped-output-test';
            }

            public function webhook()
            {
                return $this->result;
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
     * Run the webhook controller and return what it prints.
     *
     * @param WebhookResult $result Result the provider returns.
     * @return string
     * @since 1.0.0
     */
    protected function run_webhook(WebhookResult $result): string
    {
        $provider_id = $this->register_webhook_provider($result);

        remove_all_filters('rest_pre_serve_request');

        (new WebhookController())->handle(new Request(), $provider_id);

        // header() cannot run once the test runner has printed output.
        set_error_handler(static function ($severity, $message) {
            return false !== strpos($message, 'headers already sent');
        });

        ob_start();
        apply_filters('rest_pre_serve_request', false);
        $printed = (string) ob_get_clean();

        restore_error_handler();

        return $printed;
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
     * The email style block cannot be closed early, and its rules stay valid CSS.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_email_style_block_cannot_be_closed_early_and_keeps_rules(): void
    {
        ob_start();
        HtmlStyle::print_email_style_block(['.a > b' => ['color' => 'red</style><script>alert(1)</script>']]);
        $printed = ob_get_clean();

        $this->assertSame(1, substr_count($printed, '</style>'));
        $this->assertStringNotContainsString('<script', $printed);
        $this->assertStringContainsString('&lt;script&gt;', $printed);
        $this->assertStringNotContainsString('.a &gt; b', $printed);
        $this->assertStringContainsString('.a   b', $printed);

        ob_start();
        HtmlStyle::print_email_style_block(HtmlStyle::richtext_styles());
        $rich_text = ob_get_clean();

        $this->assertStringContainsString('.kirki-ecommerce-rich-text', $rich_text);
        $this->assertStringContainsString('font-size:14px', preg_replace('/\s+/', '', $rich_text));
    }

    /**
     * A plain-text acknowledgement reaches the provider as text.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_webhook_plain_text_body_is_escaped(): void
    {
        $this->assertSame('OK', $this->run_webhook(new WebhookResult(true, 'OK', 'text/plain')));
        $this->assertSame('&lt;b&gt;x&lt;/b&gt;', $this->run_webhook(new WebhookResult(true, '<b>x</b>', 'text/plain')));
    }

    /**
     * An XML acknowledgement keeps the tags the provider listed and nothing else.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_webhook_xml_body_keeps_only_allowed_tags(): void
    {
        $allowed = ['sig' => ['algo' => true, 'date' => true], 'epayment' => []];

        $receipt = $this->run_webhook(new WebhookResult(true, '<sig algo="sha256" date="20260101120000">ABC123</sig>', 'application/xml', $allowed));
        $this->assertSame('<sig algo="sha256" date="20260101120000">ABC123</sig>', $receipt);

        $legacy = $this->run_webhook(new WebhookResult(true, '<EPAYMENT>20260101120000|ABC123</EPAYMENT>', 'application/xml', $allowed));
        $this->assertSame('<EPAYMENT>20260101120000|ABC123</EPAYMENT>', $legacy);

        $unsafe = $this->run_webhook(new WebhookResult(true, '<sig algo="sha256" onload="x()">ABC</sig><script>alert(1)</script>', 'application/xml', $allowed));
        $this->assertStringNotContainsString('<script', $unsafe);
        $this->assertStringNotContainsString('onload', $unsafe);
    }
}
