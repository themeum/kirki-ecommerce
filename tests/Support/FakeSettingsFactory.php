<?php

namespace Kirki\Ecommerce\Tests\Support;

/**
 * Stands in for `SettingsFactory` in unit tests, mirroring its `get()`
 * contract so production code reaching for any settings key behaves the same
 * as it would against the real factory:
 *
 * - a bare key (`currency`) returns the settings group,
 * - a dotted key (`general.is_tax_calculation_enabled`) reads a value out of
 *   that group,
 * - an unconfigured group yields the caller's default rather than blowing up.
 *
 * That last point matters: a double that throws on unknown keys turns every
 * new `Settings::get()` call in production code into unrelated test failures.
 */
class FakeSettingsFactory
{
    /**
     * @var array<string, FakeSettingsGroup>
     */
    protected $groups = [];

    /**
     * @param array<string, array<string, mixed>|FakeSettingsGroup> $groups Settings keyed by
     *        group, e.g. `['currency' => ['decimal_separator' => '.']]`.
     */
    public function __construct(array $groups = [])
    {
        foreach ($groups as $group => $settings) {
            $this->groups[$group] = $settings instanceof FakeSettingsGroup
                ? $settings
                : new FakeSettingsGroup($settings);
        }
    }

    /**
     * @param string $key
     * @param mixed $default
     * @return mixed
     */
    public function get(string $key, $default = null)
    {
        if (strpos($key, '.')) {
            $key_parts = explode('.', $key, 2);
            $group = $this->groups[$key_parts[0]] ?? null;

            if ($group === null) {
                return $default;
            }

            return $group->get($key_parts[1]) ?? $default;
        }

        return $this->groups[$key] ?? null;
    }
}
