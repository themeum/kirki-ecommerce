<?php

namespace Kirki\Ecommerce\Tests\Unit\Payment;

use Kirki\Ecommerce\App\Payment\PaymentManager;
use Kirki\Ecommerce\App\Payment\PaymentProvider;
use Kirki\Ecommerce\App\Payment\Providers\PayPal;
use Kirki\Ecommerce\Framework\Container;
use Kirki\Ecommerce\Payments\Authorizenet;
use Kirki\Ecommerce\Payments\AuthorizenetClient;
use Kirki\Ecommerce\Payments\Payfast;
use Kirki\Ecommerce\Payments\Paymongo;
use Kirki\Ecommerce\Tests\Unit\TestCase;
use ReflectionClass;
use RuntimeException;

foreach (['AuthorizenetConstant', 'AuthorizenetTransactionBuilder', 'AuthorizenetClient', 'Authorizenet'] as $authorizenet_class) {
    require_once dirname(__DIR__, 3) . '/payments/kirki-authorizenet/src/' . $authorizenet_class . '.php';
}

class GatewayCurrencySupportTest extends TestCase
{
    /** @var array<string, mixed> */
    public $cache_values = [];

    /** @var array<string, int> */
    public $cache_ttls = [];

    public function test_empty_list_accepts_every_currency(): void
    {
        $this->assertTrue($this->provider([])->supports_currency('BDT'));
    }

    public function test_declared_list_rejects_another_currency_in_any_letter_case(): void
    {
        $provider = $this->provider(['BDT']);

        $this->assertFalse($provider->supports_currency('usd'));
        $this->assertTrue($provider->supports_currency('bdt'));
    }

    public function test_message_names_the_currency_and_the_accepted_list(): void
    {
        $this->assertSame(
            'bKash is not available in USD. Accepts: BDT.',
            $this->provider(['BDT'])->currency_unavailable_message('usd')
        );
    }

    public function test_message_names_at_most_five_currencies(): void
    {
        $this->assertSame(
            'bKash is not available in BDT. Accepts: AUD, CAD, EUR, GBP, JPY, and more.',
            $this->provider(['AUD', 'CAD', 'EUR', 'GBP', 'JPY', 'USD'])->currency_unavailable_message('BDT')
        );
    }

    public function test_no_active_currency_is_unsupported(): void
    {
        $support = $this->provider(['BDT'])->currency_support(['USD', 'EUR']);

        $this->assertSame('unsupported', $support['status']);
        $this->assertSame('bKash accepts only BDT. None of your active currencies can use it. Add BDT in the currency settings.', $support['message']);
    }

    public function test_some_active_currencies_are_limited(): void
    {
        $support = $this->provider(['BDT'])->currency_support(['USD', 'BDT']);

        $this->assertSame('limited', $support['status']);
        $this->assertSame('Customers paying in USD cannot see bKash. It accepts only BDT.', $support['message']);
    }

    public function test_all_active_currencies_are_supported(): void
    {
        $this->assertSame(['status' => 'supported', 'message' => null], $this->provider(['BDT'])->currency_support(['BDT']));
    }

    public function test_provider_with_no_list_is_supported(): void
    {
        $this->assertSame('supported', $this->provider([])->currency_support(['USD', 'BDT'])['status']);
    }

    public function test_paypal_rejects_an_unlisted_currency_and_accepts_a_listed_one(): void
    {
        $paypal = (new ReflectionClass(PayPal::class))->newInstanceWithoutConstructor();

        $this->assertFalse($paypal->supports_currency('BDT'));
        $this->assertTrue($paypal->supports_currency('USD'));
        $this->assertCount(24, $paypal->supported_currencies());
    }

    public function test_payfast_and_paymongo_declare_one_currency(): void
    {
        $base = dirname(__DIR__, 3) . '/payments/';

        foreach (['kirki-payfast/src/PayfastConstant.php', 'kirki-payfast/src/Payfast.php', 'kirki-paymongo/src/PaymongoConstant.php', 'kirki-paymongo/src/Paymongo.php'] as $file) {
            require_once $base . $file;
        }

        $this->assertSame(['ZAR'], (new ReflectionClass(Payfast::class))->newInstanceWithoutConstructor()->supported_currencies());
        $this->assertSame(['PHP'], (new ReflectionClass(Paymongo::class))->newInstanceWithoutConstructor()->supported_currencies());
    }

    public function test_authorizenet_caches_a_successful_list_for_twelve_hours(): void
    {
        $this->bind_cache();

        $this->authorizenet(['USD', 'CAD'])->supported_currencies();
        $second = $this->authorizenet(['USD', 'CAD']);

        $this->assertSame(['USD', 'CAD'], $second->supported_currencies());
        $this->assertSame(0, $second->lookups);
        $this->assertSame([43200], array_values($this->cache_ttls));
    }

    public function test_authorizenet_failed_lookup_allows_the_gateway_and_waits_five_minutes(): void
    {
        $this->bind_cache();
        $first = $this->authorizenet(new RuntimeException('API down'));

        $this->assertTrue($first->supports_currency('BDT'));
        $this->assertSame(1, $first->lookups);
        $this->assertSame([300], array_values($this->cache_ttls));

        $second = $this->authorizenet(new RuntimeException('API down'));
        $this->assertTrue($second->supports_currency('BDT'));
        $this->assertSame(0, $second->lookups);
    }

    public function test_authorizenet_without_credentials_makes_no_lookup(): void
    {
        $this->bind_cache();
        $provider = $this->authorizenet(['USD'], ['login_id' => '']);

        $this->assertSame([], $provider->supported_currencies());
        $this->assertSame(0, $provider->lookups);
    }

    public function test_authorizenet_keeps_separate_lists_for_each_account_and_environment(): void
    {
        $this->bind_cache();

        $this->authorizenet(['USD'])->supported_currencies();
        $this->authorizenet(['CAD'], ['login_id' => 'other'])->supported_currencies();
        $this->authorizenet(['GBP'], ['sandbox' => true])->supported_currencies();

        $this->assertCount(3, $this->cache_values);
    }

    public function test_checkout_providers_exclude_restricted_gateways(): void
    {
        $bkash = $this->provider(['BDT']);
        $open = $this->provider([]);

        $this->assertSame([$open], $this->manager([$bkash, $open])->get_checkout_providers('USD'));
    }

    public function test_alternatives_follow_the_given_order_without_the_paying_currency(): void
    {
        $manager = $this->manager([$this->provider(['BDT', 'ZAR', 'USD'])]);

        $this->assertSame(['ZAR', 'BDT'], $manager->get_alternative_currencies('USD', ['USD', 'ZAR', 'EUR', 'BDT']));
    }

    public function test_alternatives_stop_at_three(): void
    {
        $manager = $this->manager([$this->provider(['BDT', 'ZAR', 'INR', 'PHP'])]);

        $this->assertSame(['BDT', 'ZAR', 'INR'], $manager->get_alternative_currencies('USD', ['BDT', 'ZAR', 'INR', 'PHP']));
    }

    /**
     * @dataProvider notice_cases
     *
     * @param string[] $accepted
     * @param string[] $active
     */
    public function test_notice_text(array $accepted, array $active, string $expected): void
    {
        $this->assertSame($expected, $this->manager([$this->provider($accepted)])->get_currency_unavailable_notice('USD', $active));
    }

    public function notice_cases(): array
    {
        return [
            'none' => [['BDT'], ['USD'], 'No payment method is available for USD.'],
            'one' => [['BDT'], ['USD', 'BDT'], 'No payment method is available for USD. Switch to BDT to complete your order.'],
            'two' => [['BDT', 'ZAR'], ['USD', 'BDT', 'ZAR'], 'No payment method is available for USD. Switch to BDT or ZAR to complete your order.'],
            'three' => [['BDT', 'ZAR', 'INR'], ['USD', 'BDT', 'ZAR', 'INR'], 'No payment method is available for USD. Switch to BDT, ZAR, or INR to complete your order.'],
        ];
    }

    public function test_no_notice_when_a_gateway_accepts_the_currency(): void
    {
        $this->assertNull($this->manager([$this->provider(['USD'])])->get_currency_unavailable_notice('USD', ['USD']));
    }

    public function test_no_notice_when_the_store_has_no_enabled_gateway(): void
    {
        $this->assertNull($this->manager([])->get_currency_unavailable_notice('USD', ['USD', 'BDT']));
    }

    /**
     * Bind an in-memory cache.
     */
    private function bind_cache(): void
    {
        $test = $this;
        $cache = new class($test) {
            private $test;

            public function __construct($test)
            {
                $this->test = $test;
            }

            public function get($key, $default = null)
            {
                return $this->test->cache_values[$key] ?? $default;
            }

            public function put($key, $value, $ttl = null)
            {
                $this->test->cache_values[$key] = $value;
                $this->test->cache_ttls[$key] = $ttl;

                return true;
            }
        };

        $container = Container::get_instance();
        $container->instance('app', $container);
        $container->bind('cache', fn() => $cache);
        $this->set_container_instance($container);
    }

    /**
     * Make an Authorize.Net provider with a fake client.
     *
     * @param string[]|RuntimeException $result   The lookup result, or the error it throws.
     * @param array<string, mixed>      $settings Settings to change.
     */
    private function authorizenet($result, array $settings = [])
    {
        $settings = array_merge(['login_id' => 'login', 'transaction_key' => 'key', 'signature_key' => 'sig', 'sandbox' => false], $settings);

        return new class($result, $settings) extends Authorizenet {
            /** @var int */
            public $lookups = 0;

            private $result;

            public function __construct($result, array $settings)
            {
                $this->result = $result;
                $this->settings = $settings;
            }

            protected function get_client(): AuthorizenetClient
            {
                $this->lookups++;

                if ($this->result instanceof RuntimeException) {
                    throw $this->result;
                }

                $result = $this->result;

                return new class($result) extends AuthorizenetClient {
                    private $result;

                    public function __construct(array $result)
                    {
                        $this->result = $result;
                    }

                    public function supported_currencies(): array
                    {
                        return $this->result;
                    }
                };
            }
        };
    }

    /**
     * @param string[] $currencies
     */
    private function provider(array $currencies): PaymentProvider
    {
        return new class($currencies) extends PaymentProvider {
            /** @var string[] */
            private $currencies;

            public function __construct(array $currencies)
            {
                $this->currencies = $currencies;
                $this->title = 'bKash';
            }

            public function supported_currencies()
            {
                return $this->currencies;
            }
        };
    }

    /**
     * @param PaymentProvider[] $enabled Enabled providers. A disabled provider is never in this list.
     */
    private function manager(array $enabled): PaymentManager
    {
        return new class($enabled) extends PaymentManager {
            /** @var PaymentProvider[] */
            private $enabled;

            public function __construct(array $enabled)
            {
                $this->enabled = $enabled;
            }

            public function get_available_providers()
            {
                return $this->enabled;
            }
        };
    }
}
