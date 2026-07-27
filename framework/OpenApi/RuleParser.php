<?php

namespace Kirki\Ecommerce\OpenApi;

use ReflectionClass;

/**
 * Parses Request validation rules into OpenAPI property definitions.
 *
 * @since 1.0.0
 */
class RuleParser
{
    /**
     * Parse a Request class rules() method into OpenAPI-friendly field metadata.
     *
     * @param string $request_class Fully qualified Request class name.
     *
     * @return array<string, array{type: string, required: bool, nullable: bool, enum: array|null}>
     * @since 1.0.0
     */
    public function parse($request_class)
    {
        if (!class_exists($request_class) || !method_exists($request_class, 'rules')) {
            return [];
        }

        $reflection = new ReflectionClass($request_class);
        $instance = $reflection->newInstanceWithoutConstructor();
        $rules = $instance->rules();

        if (!is_array($rules)) {
            return [];
        }

        $fields = [];

        foreach ($rules as $field => $rule_string) {
            if (strpos($field, '.*') !== false) {
                continue;
            }

            $fields[$field] = $this->parse_rule_string(is_array($rule_string) ? implode('|', $rule_string) : (string) $rule_string);
        }

        return $fields;
    }

    /**
     * Convert parsed fields into @OA\Property annotation lines.
     *
     * @param array $fields Parsed field metadata.
     *
     * @return array Annotation lines.
     * @since 1.0.0
     */
    public function to_property_annotations(array $fields)
    {
        $lines = [];

        foreach ($fields as $name => $meta) {
            $attrs = [
                'property="' . $name . '"',
                'type="' . $meta['type'] . '"',
            ];

            if ($meta['nullable']) {
                $attrs[] = 'nullable=true';
            }

            if (!empty($meta['enum'])) {
                $attrs[] = 'enum={"' . implode('","', $meta['enum']) . '"}';
            }

            if ($meta['type'] === 'array') {
                $lines[] = ' *         @OA\\Property(' . implode(', ', $attrs) . ', @OA\\Items(type="integer"))';
                continue;
            }

            $lines[] = ' *         @OA\\Property(' . implode(', ', $attrs) . ')';
        }

        return $lines;
    }

    /**
     * Get required field names from parsed metadata.
     *
     * @param array $fields Parsed field metadata.
     *
     * @return array
     * @since 1.0.0
     */
    public function required_fields(array $fields)
    {
        $required = [];

        foreach ($fields as $name => $meta) {
            if ($meta['required']) {
                $required[] = $name;
            }
        }

        return $required;
    }

    /**
     * Parse a single pipe-delimited validation rule string.
     *
     * @param string $rule_string Validation rules.
     *
     * @return array{type: string, required: bool, nullable: bool, enum: array|null}
     * @since 1.0.0
     */
    protected function parse_rule_string($rule_string)
    {
        $parts = explode('|', $rule_string);
        $type = 'string';
        $required = false;
        $nullable = false;
        $enum = null;

        foreach ($parts as $part) {
            $part = trim($part);

            if ($part === 'required') {
                $required = true;
                continue;
            }

            if ($part === 'nullable') {
                $nullable = true;
                continue;
            }

            if ($part === 'integer' || $part === 'int') {
                $type = 'integer';
                continue;
            }

            if ($part === 'boolean' || $part === 'bool') {
                $type = 'boolean';
                continue;
            }

            if ($part === 'numeric' || $part === 'float') {
                $type = 'number';
                continue;
            }

            if ($part === 'array') {
                $type = 'array';
                continue;
            }

            if ($part === 'string' || $part === 'email' || $part === 'url' || $part === 'date') {
                $type = 'string';
                continue;
            }

            if (strpos($part, 'in:') === 0) {
                $enum = explode(',', substr($part, 3));
                continue;
            }
        }

        return [
            'type' => $type,
            'required' => $required,
            'nullable' => $nullable,
            'enum' => $enum,
        ];
    }
}
