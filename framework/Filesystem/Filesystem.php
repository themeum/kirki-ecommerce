<?php

namespace Kirki\Ecommerce\Filesystem;

use Kirki\Ecommerce\Exceptions\NotFoundException;
use Kirki\Ecommerce\Supports\Traits\Macroable;

class Filesystem
{
    use Macroable;

    /**
     * Check if the given path is a file.
     *
     * @param string $file
     * @return bool
     */
    public function is_file($file)
    {
        return is_file($file);
    }

    /**
     * Find path names matching a pattern.
     *
     * @param string $pattern
     * @param int $flags
     * @return array
     */
    public function glob($pattern, $flags = 0)
    {
        return glob($pattern, $flags);
    }

    /**
     * Get the base name of a path.
     *
     * @param string $path
     * @return string
     */
    public function basename($path)
    {
        return pathinfo($path, PATHINFO_BASENAME);
    }

    /**
     * Get the file name of a path.
     *
     * @param string $path
     * @return string
     */
    public function name($path)
    {
        return pathinfo($path, PATHINFO_FILENAME);
    }

    /**
     * Get the file extension of a path.
     *
     * @param string $path
     * @return string
     */
    public function extension($path)
    {
        return pathinfo($path, PATHINFO_EXTENSION);
    }

    /**
     * Copy a file to a new location.
     *
     * @param string $path
     * @param string $target
     * @return bool
     */
    public function copy($path, $target)
    {
        return copy($path, $target);
    }

    /**
     * Move a file to a new location.
     *
     * @param string $path
     * @param string $target
     * @return bool
     */
    public function move($path, $target)
    {
        return rename($path, $target);
    }

    /**
     * Delete the file at a given path.
     *
     * @param string|array $paths
     * @return bool
     */
    public function delete($paths)
    {
        $paths = is_array($paths) ? $paths : func_get_args();
        $success = true;

        foreach ($paths as $path) {
            try {
                if (@unlink($path)) {
                    clearstatcache(false, $path);
                } else {
                    $success = false;
                }
            } catch (\Exception $e) {
                $success = false;
            }
        }

        return $success;
    }

    /**
     * Get or set permissions of a file or directory.
     *
     * @param string $path
     * @param int|null $mode
     * @return mixed
     */
    public function chmod($path, $mode = null)
    {
        if ($mode) {
            return chmod($path, $mode);
        }

        return substr(sprintf('%o', fileperms($path)), -4);
    }

    /**
     * Append to a file.
     *
     * @param string $path
     * @param string $data
     * @param bool $lock
     * @return int|bool
     */
    public function append($path, $data, $lock = false)
    {
        return file_put_contents($path, $data, FILE_APPEND | ($lock ? LOCK_EX : 0));
    }

    /**
     * Prepend to a file.
     *
     * @param string $path
     * @param string $data
     * @return int|bool
     */
    public function prepend($path, $data)
    {
        if ($this->exists($path)) {
            return $this->put($path, $data . $this->get($path));
        }

        return $this->put($path, $data);
    }

    /**
     * Write the contents of a file.
     *
     * @param string $path
     * @param string $data
     * @param bool $lock
     * @return int|bool
     */
    public function put($path, $data, $lock = false)
    {
        return file_put_contents($path, $data, $lock ? LOCK_EX : 0);
    }

    /**
     * Get the contents of a file.
     *
     * @param string $path
     * @return string
     *
     * @throws \Ecommerce\Exceptions\NotFoundException
     */
    public function get($path)
    {
        if (!$this->is_file($path)) {
            throw new NotFoundException(sprintf("file does not exists at [%s]", $path));
        }

        return file_get_contents($path);
    }

    /**
     * Get the contents of a JSON file and decode it.
     *
     * @param string $path
     * @param int $flags
     * @return array
     */
    public function json($path, $flags = 0)
    {
        return json_decode($this->get($path), true, 512, $flags);
    }

    /**
     * Calculate the hash of a file.
     *
     * @param string $path
     * @param string $algorithm
     * @return string
     */
    public function hash($path, $algorithm = 'md5')
    {
        return hash_file($algorithm, $path);
    }

    /**
     * Determine if a file or directory exists.
     *
     * @param string $path
     * @return bool
     */
    public function exists($path)
    {
        return file_exists($path);
    }

    /**
     * Determine if a file or directory does not exist.
     *
     * @param string $path
     * @return bool
     */
    public function missing($path)
    {
        return !$this->exists($path);
    }

    /**
     * Get the directory name of a path.
     *
     * @param string $path
     * @return string
     */
    public function dirname($path)
    {
        return pathinfo($path, PATHINFO_DIRNAME);
    }

    /**
     * Get the file type of a path.
     *
     * @param string $path
     * @return string
     */
    public function type($path)
    {
        return filetype($path);
    }

    /**
     * Get the MIME type of a path.
     *
     * @param string $path
     * @return string
     */
    public function mime_type($path)
    {
        return finfo_file(finfo_open(FILEINFO_MIME_TYPE), $path);
    }

    /**
     * Get the size of a file.
     *
     * @param string $path
     * @return int
     */
    public function size($path)
    {
        return filesize($path);
    }

    /**
     * Determine if a file is a directory.
     *
     * @param string $path
     * @return bool
     */
    public function is_directory($path)
    {
        return is_dir($path);
    }

    /**
     * Determine if a file is readable.
     *
     * @param string $path
     * @return bool
     */
    public function is_readable($path)
    {
        return is_readable($path);
    }

    /**
     * Determine if a file is writable.
     *
     * @param string $path
     * @return bool
     */
    public function is_writable($path)
    {
        return is_writable($path);
    }

    /**
     * Get the last modified time of a file.
     *
     * @param string $path
     * @return int
     */
    public function last_modified($path)
    {
        return filemtime($path);
    }

    /**
     * Make a directory.
     *
     * @param string $path
     * @param int $mode
     * @param bool $recursive
     * @return bool
     */
    public function make_dir($path, $mode = 0777, $recursive = true)
    {
        $path = pathinfo($path, PATHINFO_EXTENSION) !== ''
            ? $this->dirname($path)
            : $path;

        if ($this->exists($path)) {
            return true;
        }

        return mkdir($path, $mode, $recursive);
    }
}
