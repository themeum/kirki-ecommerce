<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;

/**
 * @method static bool is_file(string $file)
 * @method static array glob(string $pattern, int $flags = 0)
 * @method static string basename(string $path)
 * @method static string name(string $path)
 * @method static string extension(string $path)
 * @method static bool copy(string $path, string $target)
 * @method static bool move(string $path, string $target)
 * @method static bool delete(string|array $paths)
 * @method static mixed chmod(string $path, int|null $mode = null)
 * @method static int|bool append(string $path, string $data, bool $lock = false)
 * @method static int|bool prepend(string $path, string $data)
 * @method static int|bool put(string $path, string $data, bool $lock = false)
 * @method static string get(string $path)
 * @method static array json(string $path, int $flags = 0)
 * @method static string hash(string $path, string $algorithm = 'md5')
 * @method static bool exists(string $path)
 * @method static bool missing(string $path)
 * @method static string dirname(string $path)
 * @method static string type(string $path)
 * @method static string mime_type(string $path)
 * @method static int size(string $path)
 * @method static bool is_directory(string $path)
 * @method static bool is_readable(string $path)
 * @method static bool is_writable(string $path)
 * @method static int last_modified(string $path)
 *
 * @see \Kirki\Ecommerce\Filesystem\Filesystem
 */
class File extends Facade
{
    public static function get_accessor()
    {
        return 'files';
    }
}
