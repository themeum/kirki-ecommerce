<?php

namespace Kirki\Ecommerce\OpenApi;

use ReflectionClass;
use ReflectionProperty;
use RecursiveDirectoryIterator;
use RecursiveIteratorIterator;
use RegexIterator;

use function Kirki\Ecommerce\app_path;
use function Kirki\Ecommerce\base_path;

/**
 * Generates OpenAPI schema annotation files from DTO and Resource classes.
 *
 * @since 1.0.0
 */
class SchemaGenerator
{
    /**
     * Output directory for generated schema files.
     *
     * @var string
     * @since 1.0.0
     */
    protected $output_dir;

    /**
     * Create a new schema generator.
     *
     * @param string|null $output_dir Destination directory for generated files.
     *
     * @return void
     * @since 1.0.0
     */
    public function __construct($output_dir = null)
    {
        $this->output_dir = $output_dir ?: app_path('OpenApi/Schemas/Generated');
    }

    /**
     * Generate schema files for all DTOs and Resources.
     *
     * @return array List of written schema names.
     * @since 1.0.0
     */
    public function generate_all()
    {
        if (!is_dir($this->output_dir)) {
            mkdir($this->output_dir, 0755, true);
        }

        $this->clear_generated();

        $written = [];

        foreach ($this->discover_classes(app_path('DTO'), 'Kirki\\Ecommerce\\App\\DTO') as $class) {
            $written[] = $this->generate_dto_schema($class);
        }

        foreach ($this->discover_classes(app_path('Resources'), 'Kirki\\Ecommerce\\App\\Resources') as $class) {
            $written[] = $this->generate_resource_schema($class);
        }

        return array_filter($written);
    }

    /**
     * Generate a schema file for a single DTO class.
     *
     * @param string $class Fully qualified class name.
     *
     * @return string|null Schema name written, or null on skip.
     * @since 1.0.0
     */
    public function generate_dto_schema($class)
    {
        if (!class_exists($class)) {
            return null;
        }

        $reflection = new ReflectionClass($class);

        if ($reflection->isAbstract() || $reflection->isInterface()) {
            return null;
        }

        $schema_name = $reflection->getShortName();
        $properties = [];

        foreach ($reflection->getProperties(ReflectionProperty::IS_PUBLIC) as $property) {
            if ($property->getDeclaringClass()->getName() !== $class && !$property->isDefault()) {
                continue;
            }

            $type_info = $this->parse_var_type($property);
            $properties[] = $this->build_property_annotation($property->getName(), $type_info);
        }

        if (empty($properties)) {
            return null;
        }

        $this->write_schema_file($schema_name, $properties, $class);

        return $schema_name;
    }

    /**
     * Generate a schema file for a Resource class by parsing to_array().
     *
     * @param string $class Fully qualified class name.
     *
     * @return string|null Schema name written, or null on skip.
     * @since 1.0.0
     */
    public function generate_resource_schema($class)
    {
        if (!class_exists($class)) {
            return null;
        }

        $reflection = new ReflectionClass($class);

        if ($reflection->isAbstract() || !$reflection->hasMethod('to_array')) {
            return null;
        }

        $schema_name = $reflection->getShortName();
        $keys = $this->extract_array_keys_from_to_array($reflection);

        if (empty($keys)) {
            return null;
        }

        $properties = [];

        foreach ($keys as $key) {
            $properties[] = $this->build_property_annotation($key, $this->infer_type_from_key($key));
        }

        $this->write_schema_file($schema_name, $properties, $class);

        return $schema_name;
    }

    /**
     * Discover PHP classes under a directory matching a namespace prefix.
     *
     * @param string $directory Absolute path to scan.
     * @param string $namespace Namespace prefix.
     *
     * @return array Fully qualified class names.
     * @since 1.0.0
     */
    protected function discover_classes($directory, $namespace)
    {
        if (!is_dir($directory)) {
            return [];
        }

        $classes = [];
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
    }

    /**
     * Parse the @var type from a property docblock.
     *
     * @param ReflectionProperty $property Property to inspect.
     *
     * @return array{type: string, nullable: bool, items: string|null}
     * @since 1.0.0
     */
    protected function parse_var_type(ReflectionProperty $property)
    {
        $doc = $property->getDocComment() ?: '';
        $nullable = false;
        $type = 'string';
        $items = null;

        if (preg_match('/@var\s+([^\s]+)/', $doc, $matches)) {
            $raw = $matches[1];
            $parts = explode('|', $raw);

            foreach ($parts as $part) {
                $part = trim($part);

                if ($part === 'null') {
                    $nullable = true;
                    continue;
                }

                if (preg_match('/^(?:\\\\?Kirki\\\\Ecommerce\\\\Collections\\\\)?Collection<([^>]+)>$/', $part, $collection_match)
                    || preg_match('/^array<([^>]+)>$/', $part, $collection_match)
                ) {
                    $type = 'array';
                    $items = $collection_match[1];
                    continue;
                }

                if (substr($part, -2) === '[]') {
                    $type = 'array';
                    $items = substr($part, 0, -2);
                    continue;
                }

                $type = $part;
            }
        }

        return [
            'type' => $type,
            'nullable' => $nullable,
            'items' => $items,
        ];
    }

    /**
     * Infer a loose OpenAPI type from a resource array key name.
     *
     * @param string $key Property key.
     *
     * @return array{type: string, nullable: bool, items: string|null}
     * @since 1.0.0
     */
    protected function infer_type_from_key($key)
    {
        if (preg_match('/(_id|_count|id)$/', $key) || in_array($key, ['total', 'count', 'page', 'limit', 'per_page'], true)) {
            return ['type' => 'integer', 'nullable' => false, 'items' => null];
        }

        if (preg_match('/^(is_|has_)/', $key) || in_array($key, ['enabled', 'active'], true)) {
            return ['type' => 'boolean', 'nullable' => false, 'items' => null];
        }

        if (preg_match('/(_at)$/', $key)) {
            return ['type' => 'string', 'nullable' => true, 'items' => null];
        }

        return ['type' => 'string', 'nullable' => true, 'items' => null];
    }

    /**
     * Extract return array keys from a Resource to_array() method body.
     *
     * @param ReflectionClass $reflection Resource class reflection.
     *
     * @return array List of property keys.
     * @since 1.0.0
     */
    protected function extract_array_keys_from_to_array(ReflectionClass $reflection)
    {
        $method = $reflection->getMethod('to_array');
        $filename = $method->getFileName();
        $start = $method->getStartLine();
        $end = $method->getEndLine();
        $lines = array_slice(file($filename), $start - 1, $end - $start + 1);
        $body = implode('', $lines);

        preg_match_all("/['\"]([a-zA-Z0-9_]+)['\"]\\s*=>/", $body, $matches);

        return array_values(array_unique($matches[1] ?? []));
    }

    /**
     * Build a single @OA\Property annotation line.
     *
     * @param string $name Property name.
     * @param array  $type_info Parsed type information.
     *
     * @return string Annotation fragment.
     * @since 1.0.0
     */
    protected function build_property_annotation($name, array $type_info)
    {
        $open_api_type = $this->map_php_type($type_info['type']);
        $attrs = [
            'property="' . $name . '"',
            'type="' . $open_api_type . '"',
        ];

        if ($type_info['nullable']) {
            $attrs[] = 'nullable=true';
        }

        if ($open_api_type === 'array') {
            $item_type = $type_info['items'] ?? 'string';
            $mapped_item = $this->map_php_type($item_type);

            if ($this->is_schema_ref($item_type)) {
                $ref = $this->schema_ref_name($item_type);

                return ' *     @OA\\Property(' . implode(', ', $attrs) . ', @OA\\Items(ref="#/components/schemas/' . $ref . '"))';
            }

            return ' *     @OA\\Property(' . implode(', ', $attrs) . ', @OA\\Items(type="' . $mapped_item . '"))';
        }

        if ($open_api_type === 'object' && $this->is_schema_ref($type_info['type'])) {
            $ref = $this->schema_ref_name($type_info['type']);

            return ' *     @OA\\Property(property="' . $name . '", ref="#/components/schemas/' . $ref . '"'
                . ($type_info['nullable'] ? ', nullable=true' : '') . ')';
        }

        return ' *     @OA\\Property(' . implode(', ', $attrs) . ')';
    }

    /**
     * Map a PHP type string to an OpenAPI type.
     *
     * @param string $php_type PHP type name.
     *
     * @return string OpenAPI type.
     * @since 1.0.0
     */
    protected function map_php_type($php_type)
    {
        $php_type = ltrim($php_type, '\\');

        $map = [
            'int' => 'integer',
            'integer' => 'integer',
            'bool' => 'boolean',
            'boolean' => 'boolean',
            'float' => 'number',
            'double' => 'number',
            'string' => 'string',
            'array' => 'array',
            'mixed' => 'object',
            'object' => 'object',
        ];

        if (isset($map[$php_type])) {
            return $map[$php_type];
        }

        if ($this->is_schema_ref($php_type)) {
            return 'object';
        }

        return 'string';
    }

    /**
     * Determine whether a type should become a schema $ref.
     *
     * @param string $type Type name.
     *
     * @return bool
     * @since 1.0.0
     */
    protected function is_schema_ref($type)
    {
        if (strpos($type, '<') !== false || strpos($type, '>') !== false) {
            return false;
        }

        return strpos($type, '\\') !== false || preg_match('/^[A-Z]/', $type);
    }

    /**
     * Resolve a short schema name from a class type.
     *
     * @param string $type Class type.
     *
     * @return string
     * @since 1.0.0
     */
    protected function schema_ref_name($type)
    {
        $parts = explode('\\', $type);

        return end($parts);
    }

    /**
     * Write a generated schema PHP file.
     *
     * @param string $schema_name Schema component name.
     * @param array  $properties  Property annotation lines.
     * @param string $source_class Source class FQCN.
     *
     * @return void
     * @since 1.0.0
     */
    protected function write_schema_file($schema_name, array $properties, $source_class)
    {
        $property_lines = [];

        foreach ($properties as $index => $property) {
            $is_last = $index === count($properties) - 1;
            $property_lines[] = $is_last ? $property : rtrim($property) . ',';
        }

        $property_block = implode("\n", $property_lines);
        $source_label = str_replace('\\', '\\\\', $source_class);

        $content = <<<PHP
<?php

namespace Kirki\\Ecommerce\\App\\OpenApi\\Schemas\\Generated;

use OpenApi\\Annotations as OA;

/**
 * Auto-generated OpenAPI schema for {$source_label}.
 *
 * @OA\\Schema(
 *     schema="{$schema_name}",
 *     type="object",
{$property_block}
 * )
 *
 * @since 1.0.0
 */
class {$schema_name}
{
}

PHP;

        file_put_contents($this->output_dir . '/' . $schema_name . '.php', $content);
    }

    /**
     * Remove previously generated schema files.
     *
     * @return void
     * @since 1.0.0
     */
    protected function clear_generated()
    {
        foreach (glob($this->output_dir . '/*.php') ?: [] as $file) {
            if (basename($file) === 'SettingResource.php') {
                continue;
            }

            unlink($file);
        }
    }
}
