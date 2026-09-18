<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Supports\CountryData;
use ReflectionMethod;
use WP_UnitTestCase;

/**
 * Covers the sorting path that runs when ext-intl is absent.
 *
 * This lives in the Integration suite rather than the Unit suite on purpose:
 * the fallback folds accents with WordPress's own remove_accents(), and the
 * Unit suite only has a rough iconv-based stub of it. Asserting the ordering
 * against a stub would prove nothing about what a wp.org host actually does.
 *
 * The fallback is reached through reflection because it is selected by whether
 * ext-intl is installed, which a test cannot change - and the Integration job
 * does install intl, so the Collator path would otherwise always win.
 */
class CountryDataSortFallbackTest extends WP_UnitTestCase
{
    /**
     * @param array $names
     *
     * @return array
     */
    protected function sort_without_collator(array $names): array
    {
        $method = new ReflectionMethod(CountryData::class, 'asort_without_collator');
        $method->setAccessible(true);

        $args = [&$names];
        $method->invokeArgs(null, $args);

        return $names;
    }

    /**
     * Without folding, a byte comparison puts every accented name after `Z`.
     * With it, `Åland Islands` folds to `Aland Islands` and lands among the
     * A's - ahead of `Albania`, because `a` precedes `b` at the third letter.
     *
     * The sort mutates the values it is given into their folded form, so the
     * original names are recovered through the keys, which it preserves.
     */
    public function test_accented_names_sort_among_their_unaccented_peers(): void
    {
        $names = [
            0 => 'Zimbabwe',
            1 => 'Åland Islands',
            2 => 'Albania',
            3 => 'Curaçao',
        ];

        $order = array_keys($this->sort_without_collator($names));

        $this->assertSame(
            ['Åland Islands', 'Albania', 'Curaçao', 'Zimbabwe'],
            array_map(function ($position) use ($names) {
                return $names[$position];
            }, $order)
        );
    }

    public function test_the_fallback_preserves_key_association(): void
    {
        $sorted = $this->sort_without_collator([
            7 => 'Bermuda',
            3 => 'Andorra',
        ]);

        $this->assertSame([3, 7], array_keys($sorted));
    }

    /**
     * The whole point of the fallback is that a host without ext-intl still
     * gets a usable list rather than an error.
     */
    public function test_the_fallback_is_deterministic(): void
    {
        $names = ['Belgium', 'Austria', 'Åland Islands', 'Bermuda'];

        $this->assertSame(
            $this->sort_without_collator($names),
            $this->sort_without_collator($names)
        );
    }

    public function test_the_country_list_is_ordered_under_the_real_wordpress_stack(): void
    {
        CountryData::flush();

        $names = array_column(CountryData::nested(), 'name');

        $this->assertLessThan(
            array_search('Algeria', $names, true),
            array_search('Albania', $names, true)
        );
    }
}
