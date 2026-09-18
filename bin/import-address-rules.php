<?php

/**
 * Imports per-country address field rules from Google's libaddressinput.
 *
 * Source: https://chromium-i18n.appspot.com/ssl-address/data/<CC> (Apache-2.0).
 * That dataset is the upstream both Shopify and WooCommerce derive their
 * address behaviour from. It publishes, per country:
 *
 *   fmt             the address layout, e.g. "%N%n%O%n%A%n%C, %S %Z"
 *   require         which fields are mandatory, e.g. "ACSZ"
 *   state_name_type what the subdivision is called, e.g. "prefecture"
 *
 * Unlike a one-time conversion script, this targets a living upstream that
 * gains and corrects countries, so it is meant to be re-run.
 *
 * Usage: php bin/import-address-rules.php
 */

$root = dirname(__DIR__);
$countries_path = $root . '/resources/data/countries.php';
$states_path = $root . '/resources/data/states.php';
$output_path = $root . '/resources/data/address-rules.php';

if (!file_exists($countries_path)) {
    fwrite(STDERR, "Country index not found: {$countries_path}\n");
    exit(1);
}

$countries = require $countries_path;
$states = require $states_path;

/**
 * libaddressinput's state_name_type values, mapped to our label keys.
 *
 * Anything unrecognised falls back to 'region', which is also what upstream
 * uses when it declines to name the field.
 */
const LABEL_KEYS = [
    'area' => 'area',
    'county' => 'county',
    'department' => 'department',
    'district' => 'district',
    'do_si' => 'do_si',
    'emirate' => 'emirate',
    'island' => 'island',
    'oblast' => 'oblast',
    'parish' => 'parish',
    'prefecture' => 'prefecture',
    'province' => 'province',
    'state' => 'state',
];

/**
 * Countries that require a subdivision but that upstream declines to name.
 *
 * Without these, the field falls back to the generic 'region' and Canada,
 * Italy and Spain end up labelled "Region", which is plainly wrong. Only
 * countries whose state field is required are worth correcting here; the
 * generic fallback is fine for an optional field.
 */
const LABEL_OVERRIDES = [
    'AG' => 'parish',
    'AO' => 'province',
    'AZ' => 'district',
    'BA' => 'canton',
    'BD' => 'district',
    'BG' => 'province',
    'BI' => 'province',
    'BJ' => 'department',
    'BM' => 'parish',
    'BO' => 'department',
    'BT' => 'district',
    'BW' => 'district',
    'BZ' => 'district',
    'CA' => 'province',
    'CF' => 'prefecture',
    'CG' => 'department',
    'CN' => 'province',
    'CR' => 'province',
    'CU' => 'province',
    'DM' => 'parish',
    'DO' => 'province',
    'EE' => 'county',
    'ES' => 'province',
    'GA' => 'province',
    'GD' => 'parish',
    'GM' => 'division',
    'GQ' => 'province',
    'GT' => 'department',
    'ID' => 'province',
    'IL' => 'district',
    'IT' => 'province',
    'KP' => 'province',
    'LA' => 'province',
    'LC' => 'quarter',
    'LR' => 'county',
    'LS' => 'district',
    'LV' => 'municipality',
    'LY' => 'district',
    'MD' => 'district',
    'ME' => 'municipality',
    'MG' => 'province',
    'MK' => 'municipality',
    'MN' => 'province',
    'MW' => 'district',
    'MZ' => 'province',
    'PA' => 'province',
    'PG' => 'province',
    'PY' => 'department',
    'RO' => 'county',
    'RS' => 'district',
    'RW' => 'province',
    'SB' => 'province',
    'SE' => 'county',
    'SG' => 'council',
    'SI' => 'municipality',
    'SR' => 'district',
    'SV' => 'department',
    'TL' => 'municipality',
    'UG' => 'district',
    'UY' => 'department',
    'VC' => 'parish',
    'ZM' => 'province',
    'ZW' => 'province',
];

const MODE_HIDDEN = 'hidden';
const MODE_OPTIONAL = 'optional';
const MODE_REQUIRED = 'required';

/**
 * Fetch one country's metadata, following the endpoint's redirect.
 *
 * @param string $code
 *
 * @return array|null Decoded metadata, or null when unavailable.
 */
function fetch_country_metadata(string $code)
{
    $url = 'https://chromium-i18n.appspot.com/ssl-address/data/' . rawurlencode($code);

    $context = stream_context_create([
        'http' => [
            'method' => 'GET',
            'timeout' => 20,
            'follow_location' => 1,
            'max_redirects' => 5,
            'header' => "Accept: application/json\r\n",
        ],
    ]);

    $body = @file_get_contents($url, false, $context);

    if ($body === false) {
        return null;
    }

    $decoded = json_decode($body, true);

    return is_array($decoded) ? $decoded : null;
}

/**
 * Decide a field's mode from libaddressinput's fmt and require strings.
 *
 * @param string $fmt           The country's address layout.
 * @param string $require       The country's required-field letters.
 * @param string $token         The fmt token, e.g. '%S'.
 * @param string $require_letter The require letter, e.g. 'S'.
 *
 * @return string One of the MODE_* constants.
 */
function resolve_mode(string $fmt, string $require, string $token, string $require_letter): string
{
    if (strpos($fmt, $token) === false) {
        return MODE_HIDDEN;
    }

    return strpos($require, $require_letter) !== false ? MODE_REQUIRED : MODE_OPTIONAL;
}

$rules = [];
$missing = [];
$total = count($countries);
$index = 0;

foreach ($countries as $code => $country) {
    $index++;
    fwrite(STDERR, sprintf("\r[%d/%d] %s   ", $index, $total, $code));

    $has_states = !empty($states[$code]);
    $meta = fetch_country_metadata($code);

    if ($meta === null) {
        $missing[] = $code;

        $rules[$code] = [
            'state' => [
                'mode' => $has_states ? MODE_OPTIONAL : MODE_HIDDEN,
                'label' => 'region',
            ],
            'postal_code' => ['mode' => MODE_OPTIONAL],
        ];

        continue;
    }

    $fmt = (string) ($meta['fmt'] ?? '');
    $require = (string) ($meta['require'] ?? '');

    $state_mode = resolve_mode($fmt, $require, '%S', 'S');

    // Deliberate deviation from upstream: where we hold subdivisions for a
    // country whose addresses do not use one, offer the field rather than
    // hiding it. This unblocks checkout without taking away a choice a
    // merchant may already rely on.
    if ($state_mode === MODE_HIDDEN && $has_states) {
        $state_mode = MODE_OPTIONAL;
    }

    $label = $meta['state_name_type'] ?? null;
    $label_key = LABEL_KEYS[$label] ?? null;

    if ($label_key === null && $state_mode === MODE_REQUIRED) {
        $label_key = LABEL_OVERRIDES[$code] ?? null;
    }

    $rules[$code] = [
        'state' => [
            'mode' => $state_mode,
            'label' => $label_key ?? 'region',
        ],
        'postal_code' => [
            'mode' => resolve_mode($fmt, $require, '%Z', 'Z'),
        ],
    ];
}

fwrite(STDERR, "\r" . str_repeat(' ', 40) . "\r");

/**
 * Render a value as PHP source.
 *
 * @param mixed $value
 * @param int   $depth
 *
 * @return string
 */
function render_value($value, int $depth = 1): string
{
    $indent = str_repeat('    ', $depth);
    $closing_indent = str_repeat('    ', $depth - 1);

    if (is_array($value)) {
        if (empty($value)) {
            return '[]';
        }

        $lines = [];

        foreach ($value as $key => $item) {
            $lines[] = $indent . var_export((string) $key, true) . ' => ' . render_value($item, $depth + 1) . ',';
        }

        return "[\n" . implode("\n", $lines) . "\n" . $closing_indent . ']';
    }

    return var_export((string) $value, true);
}

$header = <<<'PHP'
<?php

/**
 * Per-country address field rules.
 *
 * For each country: whether the state and postal code fields are hidden,
 * optional or required, and the term that country uses for its subdivision.
 *
 * Imported from Google's libaddressinput (Apache-2.0) by
 * bin/import-address-rules.php. That upstream is maintained and changes over
 * time, so this file can be regenerated by re-running the importer - it is
 * not a one-time conversion. Prefer re-importing over editing by hand.
 */

return
PHP;

file_put_contents($output_path, rtrim($header) . ' ' . render_value($rules) . ";\n");

$state_modes = array_count_values(array_column(array_column($rules, 'state'), 'mode'));
$zip_modes = array_count_values(array_column(array_column($rules, 'postal_code'), 'mode'));

printf("Wrote %d countries to %s\n", count($rules), str_replace($root . '/', '', $output_path));
printf(
    "  state:       required=%d optional=%d hidden=%d\n",
    $state_modes[MODE_REQUIRED] ?? 0,
    $state_modes[MODE_OPTIONAL] ?? 0,
    $state_modes[MODE_HIDDEN] ?? 0
);
printf(
    "  postal_code: required=%d optional=%d hidden=%d\n",
    $zip_modes[MODE_REQUIRED] ?? 0,
    $zip_modes[MODE_OPTIONAL] ?? 0,
    $zip_modes[MODE_HIDDEN] ?? 0
);

if ($missing) {
    printf(
        "  %d countries had no upstream metadata and used the fallback: %s\n",
        count($missing),
        implode(', ', $missing)
    );
}
