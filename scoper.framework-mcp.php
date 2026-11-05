<?php

declare(strict_types=1);

use Symfony\Component\Finder\Finder;

/*
 * Second php-scoper pass for ahamed/framework-mcp, run by composer.json's
 * `scope` script. It is a separate config because php-scoper writes its output
 * relative to the common parent of every file it finds: adding this package to
 * scoper.config.php's finder would move the framework's scoped tree.
 *
 * Derived from the package's scoper.example.php.
 */
return [
    'prefix' => 'Kirki\Ecommerce',
    'finders' => [
        Finder::create()
            ->files()
            ->in(__DIR__ . '/vendor/libraries/framework-mcp/src')
            ->name(['*.php', '*.stub'])
    ],
    'exclude-files' => [],

    // Prefix this package and the framework it calls; leave everything else,
    // the global namespace and the MCP Adapter's WP\MCP classes included, alone.
    'exclude-namespaces' => [
        '~^$~',
        '/^(?!(?:Framework|Ahamed\\\\FrameworkMcp)($|\\\\))/',
    ],
    'expose-global-classes' => true,
    'expose-global-functions' => true,
    'expose-global-constants' => true,

    // php-scoper leaves comments alone, so the facade's @method lines and other
    // docblock types would still name the unprefixed classes.
    'patchers' => [
        static function (string $file_path, string $prefix, string $contents): string {
            return preg_replace_callback(
                '/^\s*\*\s*@(?:method|property|param|return|var|see|throws)\b.*$/m',
                static function (array $line) use ($prefix): string {
                    return preg_replace(
                        '/(?<![\w\\\\])\\\\(Ahamed\\\\FrameworkMcp|Framework)\\\\/',
                        '\\\\' . addcslashes($prefix, '\\') . '\\\\$1\\\\',
                        $line[0]
                    );
                },
                $contents
            );
        },
    ],
];
