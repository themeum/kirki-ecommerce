<?php

namespace Kirki\Ecommerce\Filesystem;

class Path
{
    public static function join($base, ...$paths)
    {
        foreach ($paths as $index => $path) {
            if (empty($path) && $path !== '0') {
                unset($paths[$index]);
            } else {
                $paths[$index] = DIRECTORY_SEPARATOR . ltrim($path, DIRECTORY_SEPARATOR);
            }
        }

        return $base . implode('', $paths);
    }
}
