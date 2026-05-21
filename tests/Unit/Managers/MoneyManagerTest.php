<?php

namespace Kirki\Ecommerce\Tests\Unit\Managers;

use BadMethodCallException;
use Brick\Money\Money;
use InvalidArgumentException;
use Kirki\Ecommerce\Managers\MoneyManager;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class MoneyManagerTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->bind_money_dependencies();
    }

    public function test_to_minor_converts_decimal_amount_to_minor_units(): void
    {
        $this->assertSame(1099, MoneyManager::to_minor('10.99', 'USD'));
    }

    public function test_from_minor_converts_minor_units_to_money_instance(): void
    {
        $money = MoneyManager::from_minor(1099, 'USD');

        $this->assertInstanceOf(Money::class, $money);
        $this->assertSame('10.99', (string) $money->getAmount());
        $this->assertSame('USD', $money->getCurrency()->getCurrencyCode());
    }

    public function test_to_minor_uses_base_currency_when_currency_is_empty(): void
    {
        $this->assertSame(500, MoneyManager::to_minor('5.00'));
    }

    public function test_zero_returns_zero_amount_for_currency(): void
    {
        $manager = new MoneyManager();
        $money = $manager->zero('EUR');

        $this->assertTrue($money->isZero());
        $this->assertSame('EUR', $money->getCurrency()->getCurrencyCode());
    }

    public function test_format_applies_currency_position_and_separators(): void
    {
        $this->bind_money_dependencies('USD', [
            'decimal_separator' => ',',
            'thousand_separator' => '.',
            'currency_position' => 'after',
        ]);

        $manager = new MoneyManager();
        $money = $manager->of('1234.50', 'USD');
        $formatted = $manager->format($money);

        $this->assertSame('1.234,50$', $formatted);
    }

    public function test_format_from_minor_formats_stored_amount(): void
    {
        $manager = new MoneyManager();

        $this->assertSame('$10.99', $manager->format_from_minor(1099, 'USD'));
    }

    public function test_format_from_decimal_formats_decimal_amount(): void
    {
        $manager = new MoneyManager();

        $this->assertSame('$25.00', $manager->format_from_decimal('25', 'USD'));
    }

    public function test_get_currency_symbol_returns_symbol_for_code(): void
    {
        $this->assertSame('$', MoneyManager::get_currency_symbol('USD'));
    }

    public function test_convert_to_currency_uses_explicit_exchange_rate(): void
    {
        $manager = new MoneyManager();
        $money = $manager->of('10.00', 'USD');
        $converted = $manager->convert_to_currency($money, 'EUR', 0.85);

        $this->assertSame('EUR', $converted->getCurrency()->getCurrencyCode());
        $this->assertSame('8.50', (string) $converted->getAmount());
    }

    public function test_magic_call_delegates_to_brick_money(): void
    {
        $manager = new MoneyManager();
        $first = $manager->of('10.00', 'USD');
        $second = $manager->of('5.00', 'USD');
        $total = $manager->total($first, $second);

        $this->assertSame('15.00', (string) $total->getAmount());
    }

    public function test_magic_call_defaults_currency_to_base_currency(): void
    {
        $manager = new MoneyManager();
        $money = $manager->of('12.34');

        $this->assertSame('USD', $money->getCurrency()->getCurrencyCode());
    }

    public function test_magic_call_throws_for_unknown_method(): void
    {
        $manager = new MoneyManager();

        $this->expectException(BadMethodCallException::class);

        $manager->unknownMethod('10.00');
    }

    public function test_magic_call_requires_at_least_one_parameter(): void
    {
        $manager = new MoneyManager();

        $this->expectException(InvalidArgumentException::class);

        $manager->of();
    }
}
