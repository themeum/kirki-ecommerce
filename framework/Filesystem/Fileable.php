<?php

namespace Kirki\Ecommerce\Filesystem;

/**
 * Fileable
 *
 * @method bool is_file()
 * @method array glob($pattern, int $flags = 0)
 * @method string basename()
 * @method string name()
 * @method string extension()
 * @method bool copy(string $target)
 * @method bool move(string $target)
 * @method bool delete(string|array $paths)
 * @method mixed chmod(int|null $mode = null)
 * @method int|bool append(string $data, bool $lock = false)
 * @method int|bool prepend(string $data)
 * @method int|bool put(string $data, bool $lock = false)
 * @method string get()
 * @method array json(int $flags = 0)
 * @method string hash(string $algorithm = 'md5')
 * @method bool exists()
 * @method bool missing()
 * @method string dirname()
 * @method string type()
 * @method string mime_type()
 * @method int size()
 * @method bool is_directory()
 * @method bool is_readable()
 * @method bool is_writable()
 * @method int last_modified()
 */
class Fileable
{
    /**
     * The path to the file.
     *
     * @var string
     */
    protected $path;

    /**
     * Create a new file instance.
     *
     * @param string $path
     * @return void
     */
    public function __construct(string $path)
    {
        $this->path = $path;
    }

    /**
     * Create a new file instance.
     *
     * @param string $path
     * @return static
     */
    public static function make(string $path)
    {
        return new static($path);
    }

    /**
     * Get the parameters for the given method.
     *
     * @param string $method
     * @param array $parameters
     * @return array
     */
    protected function parameters($method, $parameters)
    {
        $exception_methods = ['delete', 'glob'];

        if (in_array($method, $exception_methods)) {
            return $parameters;
        }

        return array_merge([$this->path], $parameters);
    }

    /**
     * Handle dynamic method calls into the filesystem.
     *
     * @param string $method
     * @param array $parameters
     * @return mixed
     */
    public function __call($method, $parameters)
    {
        $filesystem = new Filesystem();

        if (!method_exists($filesystem, $method)) {
            throw new \BadMethodCallException("Method [$method] does not exist on [Filesystem].");
        }

        return $filesystem->{$method}(...$this->parameters($method, $parameters));
    }
}
