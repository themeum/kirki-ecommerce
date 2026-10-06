<?php

namespace Kirki\Ecommerce\Tests\Support;

/**
 * Stands in for an `AppSettings` group in unit tests: the same `get()`
 * contract - no argument returns the whole group - backed by a plain array
 * instead of the options table.
 */
class FakeSettingsGroup
{
    /**
     * @var array<string, mixed>
     */
    protected $settings;

    /**
     * @param array<string, mixed> $settings
     */
    public function __construct(array $settings = [])
    {
        $this->settings = $settings;
    }

    /**
     * @param string|null $key
     * @param mixed $default
     * @return mixed
     */
    public function get($key = null, $default = null)
    {
        if ($key === null) {
            return $this->settings;
        }

        $value = $this->settings;

        foreach (explode('.', $key) as $segment) {
            if (!is_array($value) || !array_key_exists($segment, $value)) {
                return $default;
            }

            $value = $value[$segment];
        }

        return $value ?? $default;
    }
}
