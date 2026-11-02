<?php

namespace Kirki\Ecommerce\Tests\Unit\Supports;

use Kirki\Ecommerce\App\Supports\AddressRules;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class AddressRulesTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();

        $this->bootstrap_application();
        AddressRules::flush();
    }

    public function test_every_country_has_a_rule_and_every_rule_has_a_country(): void
    {
        $countries = array_keys(CountryData::index());
        $rules = array_keys(AddressRules::all());

        sort($countries);
        sort($rules);

        $this->assertSame(
            $countries,
            $rules,
            'The rules table and the country index must not drift apart.'
        );
    }

    public function test_every_rule_declares_a_known_mode_for_both_fields(): void
    {
        $modes = [AddressRules::HIDDEN, AddressRules::OPTIONAL, AddressRules::REQUIRED];

        foreach (AddressRules::all() as $code => $rule) {
            foreach (['state', 'postal_code'] as $field) {
                $this->assertArrayHasKey($field, $rule, "{$code} is missing a {$field} rule.");
                $this->assertContains(
                    $rule[$field]['mode'],
                    $modes,
                    "{$code} has an unknown {$field} mode."
                );
            }

            $this->assertArrayHasKey('label', $rule['state'], "{$code} has no state label.");
        }
    }

    /**
     * The bug this change exists to fix: countries whose addresses carry no
     * subdivision must not demand one, however many rows we happen to hold.
     */
    public function test_countries_without_subdivisions_in_their_addresses_do_not_require_a_state(): void
    {
        foreach (['FR', 'GB', 'DE', 'DK', 'BE', 'AT'] as $code) {
            $this->assertFalse(
                AddressRules::is_required($code, 'state'),
                "{$code} must not require a state."
            );
        }
    }

    public function test_countries_that_use_a_subdivision_require_one(): void
    {
        foreach (['US', 'CA', 'JP', 'AU', 'IN', 'AE'] as $code) {
            $this->assertTrue(
                AddressRules::is_required($code, 'state'),
                "{$code} must require a state."
            );
        }
    }

    public function test_countries_without_postal_codes_hide_the_field(): void
    {
        foreach (['AE', 'HK'] as $code) {
            $this->assertTrue(
                AddressRules::is_hidden($code, 'postal_code'),
                "{$code} must hide the postal code field."
            );
        }

        $this->assertFalse(AddressRules::is_hidden('US', 'postal_code'));
    }

    public function test_state_label_uses_the_country_term(): void
    {
        $this->assertSame('Prefecture', AddressRules::state_label('JP'));
        $this->assertSame('Emirate', AddressRules::state_label('AE'));
        $this->assertSame('Province', AddressRules::state_label('CA'));
        $this->assertSame('State', AddressRules::state_label('US'));
        $this->assertSame('County', AddressRules::state_label('IE'));
    }

    /**
     * The bug this guards: every publication point shipped `all()` straight to
     * the client, so the storefront rendered the lookup key - a lowercase
     * "region" above the field, and "do_si" for South Korea. `state_label()`
     * was correct all along; nothing on the render path called it.
     */
    public function test_published_rules_carry_a_display_term_not_a_lookup_key(): void
    {
        $keys = ['area', 'canton', 'council', 'county', 'department', 'district', 'division',
                 'do_si', 'emirate', 'island', 'municipality', 'oblast', 'parish', 'prefecture',
                 'province', 'quarter', 'region', 'state'];

        foreach (AddressRules::all_for_display() as $code => $rule) {
            $label = $rule['state']['label'];

            $this->assertNotContains(
                $label,
                $keys,
                "{$code} published the raw lookup key '{$label}' instead of a display term."
            );
            $this->assertSame(
                ucfirst($label),
                $label,
                "{$code} published a label that does not start with a capital: '{$label}'."
            );
        }
    }

    public function test_published_rules_match_the_stored_rules_apart_from_the_label(): void
    {
        $stored = AddressRules::all();
        $published = AddressRules::all_for_display();

        $this->assertSame(array_keys($stored), array_keys($published));

        foreach ($published as $code => $rule) {
            $this->assertSame($stored[$code]['state']['mode'], $rule['state']['mode']);
            $this->assertSame($stored[$code]['postal_code'], $rule['postal_code']);
            $this->assertSame(['mode', 'label'], array_keys($rule['state']));
        }
    }

    public function test_a_single_published_rule_uses_the_country_term(): void
    {
        $this->assertSame('Prefecture', AddressRules::for_display('JP')['state']['label']);
        $this->assertSame('Region', AddressRules::for_display('AL')['state']['label']);
        $this->assertSame('Region', AddressRules::for_display('ZZ')['state']['label']);
    }

    /**
     * A label key with no matching case in translate_label() falls through to
     * "Region" silently - the field reads plausibly while being wrong. This
     * catches that at the point a new key is introduced.
     */
    public function test_every_label_key_in_the_data_has_a_term(): void
    {
        $keys = [];

        foreach (AddressRules::all() as $rule) {
            $keys[$rule['state']['label']] = true;
        }

        unset($keys['region']);

        $translate = new \ReflectionMethod(AddressRules::class, 'translate_label');
        $translate->setAccessible(true);

        foreach (array_keys($keys) as $key) {
            $this->assertNotSame(
                'Region',
                $translate->invoke(null, $key),
                "The label key '{$key}' has no case in translate_label(), so it renders as 'Region'."
            );
        }
    }

    public function test_country_code_casing_is_ignored(): void
    {
        $this->assertSame(
            AddressRules::for_country('JP'),
            AddressRules::for_country('jp')
        );
    }

    public function test_unknown_country_falls_back_without_requiring_anything(): void
    {
        $rules = AddressRules::for_country('ZZ');

        $this->assertSame(AddressRules::HIDDEN, $rules['state']['mode']);
        $this->assertSame(AddressRules::OPTIONAL, $rules['postal_code']['mode']);
        $this->assertFalse(AddressRules::is_required('ZZ', 'state'));
    }
}
