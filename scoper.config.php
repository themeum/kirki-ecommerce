<?php

declare(strict_types=1);

use Symfony\Component\Finder\Finder;

return [
    'prefix' => 'Kirki\Ecommerce',
    'finders' => [
        Finder::create()
            ->files()
            ->in(__DIR__ . '/vendor/themeum/framework/src')
            ->exclude(['test', 'tests', 'Tests'])
            ->name(['*.php', '*.stub'])
    ],
    'exclude-files' => [],
    'exclude-namespaces' => [
        '~^$~',
        '/^(?!Framework($|\\\\))/',
    ],
    'expose-global-classes' => true,
    'expose-global-functions' => true,
    'expose-global-constants' => true,
];
