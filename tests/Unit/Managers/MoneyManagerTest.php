<?php

namespace Kirki\Ecommerce\Tests\Unit\Managers;

use BadMethodCallException;
use Brick\Money\Money;
use InvalidArgumentException;
use Kirki\Ecommerce\App\Managers\MoneyManager;
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

    /**
     * @dataProvider short_amounts
     */
    public function test_format_short_uses_units_above_one_thousand(string $amount, string $expected): void
    {
        $manager = new MoneyManager();

        $this->assertSame($expected, $manager->format_short($manager->of($amount, 'USD')));
    }

    public function short_amounts(): array
    {
        return [
            'below 1,000' => ['850', '$850.00'],
            'just below 1,000' => ['999.99', '$999.99'],
            'exactly 1,000' => ['1000', '$1K'],
            'decimal that is 0' => ['20000', '$20K'],
            'thousands' => ['20345', '$20.3K'],
            'rounds half up' => ['20350', '$20.4K'],
            'stays in thousands' => ['999949', '$999.9K'],
            'moves to millions' => ['999950', '$1M'],
            'millions' => ['1234567', '$1.2M'],
            'billions' => ['3000000000', '$3B'],
            'trillions' => ['1000000000000', '$1T'],
            'above the last unit' => ['1500000000000000', '$1,500T'],
            'negative' => ['-20345', '$-20.3K'],
        ];
    }

    public function test_format_short_applies_currency_position_and_separators(): void
    {
        $this->bind_money_dependencies('EUR', [
            'decimal_separator' => ',',
            'thousand_separator' => '.',
            'currency_position' => 'after',
        ], ['EUR' => '€']);

        $manager = new MoneyManager();

        $this->assertSame('20,3K€', $manager->format_short($manager->of('20345', 'EUR')));
        $this->assertSame('850,00€', $manager->format_short($manager->of('850', 'EUR')));
    }

    public function test_format_short_keeps_zero_decimal_currency_below_one_thousand(): void
    {
        $manager = new MoneyManager();

        $this->assertSame($manager->format($manager->of('850', 'JPY')), $manager->format_short($manager->of('850', 'JPY')));
        $this->assertStringEndsWith('20.3K', $manager->format_short($manager->of('20345', 'JPY')));
    }

    public function test_to_short_dto_adds_short_display_to_money_object(): void
    {
        $dto = (new MoneyManager())->to_short_dto(2034500, 'USD')->all();

        $this->assertSame(['short_display', 'raw', 'display', 'currency'], array_keys($dto));
        $this->assertSame('$20,345.00', $dto['display']);
        $this->assertSame('$20.3K', $dto['short_display']);
        $this->assertSame(20345.0, $dto['raw']);
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

    public function test_get_currency_symbol_prefers_symbol_stored_in_database(): void
    {
        $this->bind_money_dependencies('USD', [], ['BDT' => "\u{09F3}"]);

        $this->assertSame("\u{09F3}", MoneyManager::get_currency_symbol('bdt'));
    }

    public function test_get_currency_symbol_falls_back_to_icu_when_not_in_database(): void
    {
        $this->bind_money_dependencies('USD', [], []);

        $this->assertSame('€', MoneyManager::get_currency_symbol('EUR'));
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
