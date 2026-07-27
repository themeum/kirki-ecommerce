<?php

/**
 * Generate OpenAPI schemas from DTOs/Resources and compile openapi.json.
 *
 * Does not modify path files under app/OpenApi/Paths/.
 *
 * Usage:
 *   php bin/generate-openapi.php
 *   composer docs:generate
 */

require __DIR__ . '/../vendor/autoload.php';

use Kirki\Ecommerce\OpenApi\SchemaGenerator;
use OpenApi\Generator;

$base = dirname(__DIR__);
$schemas_dir = $base . '/app/OpenApi/Schemas/Generated';
$scan_path = $base . '/app/OpenApi';
$output = $base . '/storage/openapi/openapi.json';

if (!is_dir($schemas_dir)) {
    mkdir($schemas_dir, 0755, true);
}

if (!is_dir(dirname($output))) {
    mkdir(dirname($output), 0755, true);
}

$generator = new SchemaGenerator($schemas_dir);

$discover = function ($directory, $namespace) {
    $classes = [];

    if (!is_dir($directory)) {
        return $classes;
    }

    $directory = rtrim($directory, '/\\');
    $iterator = new RegexIterator(
        new RecursiveIteratorIterator(new RecursiveDirectoryIterator($directory)),
        '/^.+\.php$/i',
        RegexIterator::GET_MATCH
    );

    foreach ($iterator as $file) {
        $path = $file[0];
        $relative = substr($path, strlen($directory) + 1);
        $relative = preg_replace('/\.php$/i', '', $relative);
        $relative = str_replace(['/', '\\'], '\\', $relative);
        $class = $namespace . '\\' . $relative;

        if (class_exists($class)) {
            $classes[] = $class;
        }
    }

    sort($classes);

    return $classes;
};

foreach (glob($schemas_dir . '/*.php') ?: [] as $file) {
    // Preserve manually maintained schemas that cannot be inferred from source.
    if (basename($file) === 'SettingResource.php') {
        continue;
    }

    unlink($file);
}

$written = [];

foreach ($discover($base . '/app/DTO', 'Kirki\\Ecommerce\\App\\DTO') as $class) {
    $name = $generator->generate_dto_schema($class);

    if ($name) {
        $written[] = $name;
    }
}

foreach ($discover($base . '/app/Resources', 'Kirki\\Ecommerce\\App\\Resources') as $class) {
    $name = $generator->generate_resource_schema($class);

    if ($name) {
        $written[] = $name;
    }
}

echo 'Generated ' . count($written) . " schema components.\n";

$openapi_generator = new Generator();
$openapi_generator->setAliases(array_merge(Generator::DEFAULT_ALIASES, [
    'OA' => 'OpenApi\\Annotations',
]));

$openapi = $openapi_generator->generate([$scan_path]);

if ($openapi === false || $openapi === null) {
    fwrite(STDERR, "Failed to scan OpenAPI annotations.\n");
    exit(1);
}

$json = $openapi->toJson();
file_put_contents($output, $json);

$decoded = json_decode($json, true);
$path_count = isset($decoded['paths']) ? count($decoded['paths']) : 0;
$schema_count = isset($decoded['components']['schemas']) ? count($decoded['components']['schemas']) : 0;

if ($path_count === 0) {
    fwrite(STDERR, "Warning: OpenAPI document has no paths.\n");
}

echo "Wrote {$output}\n";
echo "Paths: {$path_count}, Schemas: {$schema_count}\n";
