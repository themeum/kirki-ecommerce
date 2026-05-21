<?php

namespace Kirki\Ecommerce\Tests\Support\Database;

class TestWpdb
{
    public $prefix;

    public $charset;

    public $collate;

    public function __construct(array $config = [])
    {
        $this->prefix = $config['prefix'] ?? 'wp_';
        $this->charset = $config['charset'] ?? 'utf8mb4';
        $this->collate = $config['collate'] ?? 'utf8mb4_unicode_ci';
    }

    public function prepare($query, ...$args)
    {
        if (empty($args)) {
            return $query;
        }

        $index = 0;

        return preg_replace_callback('/%[dfs]/', function () use (&$index, $args) {
            $value = $args[$index] ?? '';
            $index++;

            if (is_null($value)) {
                return 'NULL';
            }

            if (is_int($value) || is_float($value)) {
                return (string) $value;
            }

            return "'" . addslashes((string) $value) . "'";
        }, $query);
    }
}
