<?php

namespace Kirki\Ecommerce;

use Kirki\Ecommerce\App\Decisions\DecisionEngine;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Models\Currency;
use Kirki\Ecommerce\App\Services\CurrencyService;
use Kirki\Ecommerce\Application;
use Kirki\Ecommerce\AppSettings;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Wordpress\Customer;
use Kirki\Ecommerce\Database\Migrations\Migrator;
use Kirki\Ecommerce\Wordpress\User;
use Kirki\Ecommerce\Http\Response;
use Kirki\Ecommerce\Supports\Arr;
use Kirki\Ecommerce\Supports\Facades\Settings;
use Kirki\Ecommerce\Supports\HigherOrderTapProxy;
use Kirki\Ecommerce\Supports\Str;
use Kirki\Ecommerce\Supports\Url;
use Kirki\Ecommerce\Supports\Utils;

if (!function_exists('Kirki\Ecommerce\app')) {
    /**
     * Get the container instance.
     *
     * @template TClass
     *
     * @param string|class-string<TClass>|null $abstract
     * @param array $parameters
     *
     * @return ($abstract is class-string<TClass> ? TClass : ($abstract is null ? Application : mixed))
     */
    function app($abstract = null, array $parameters = [])
    {
        if (is_null($abstract)) {
            return Application::get_instance();
        }

        return Application::get_instance()
            ->make($abstract, $parameters);
    }
}

if (!function_exists('Kirki\Ecommerce\deep_get')) {
    /**
     * Get a value from an array using a dot notation key.
     *
     * @param array $array
     * @param string|array $key
     * @param mixed $default
     * @return mixed
     */
    function deep_get($target, $key, $default = null)
    {
        if (is_null($key)) {
            return $target;
        }

        $key = is_array($key) ? $key : explode('.', $key);

        foreach ($key as $index => $segment) {
            unset($key[$index]);

            if (is_null($segment)) {
                return $target;
            }

            if ($segment === '*') {
                if ($target instanceof Collection) {
                    $target = $target->all();
                } elseif (!is_iterable($target)) {
                    return $default;
                }

                $result = [];

                foreach ($target as $item) {
                    $result[] = deep_get($item, $key);
                }

                return in_array('*', $key) ? Arr::collapse($result) : $result;
            }

            switch ($segment) {
                case '\*':
                    $segment = '*';
                    break;
                case '\{first}':
                    $segment = '{first}';
                    break;
                case '{first}':
                    $segment = array_key_first(Arr::from($target));
                    break;
                case '\{last}':
                    $segment = '{last}';
                    break;
                case '{last}':
                    $segment = array_key_last(Arr::from($target));
                    break;
            }

            if (Arr::accessible($target) && Arr::exists($target, $segment)) {
                $target = $target[$segment];
            } elseif (is_object($target) && isset($target->{$segment})) {
                $target = $target->{$segment};
            } else {
                return $default;
            }
        }

        return $target;
    }
}


if (!function_exists('Kirki\Ecommerce\config')) {
    /**
     * Get the config
     *
     * @param string|null $key
     * @param mixed $default
     * @return mixed
     */
    function config($key = null, $default = null)
    {
        static $cache = [];

        $filename = strpos($key, '.') ? substr($key, 0, strpos($key, '.')) : $key;
        $key = strpos($key, '.') ? substr($key, strpos($key, '.') + 1) : null;

        if (!isset($cache[$filename])) {
            $path = app()->config_path("{$filename}.php");

            if (file_exists($path)) {
                $cache[$filename] = include $path;
            } else {
                $cache[$filename] = null;
            }
        }

        if (is_null($cache[$filename])) {
            return $default;
        }

        return deep_get($cache[$filename], $key, $default);
    }
}

if (!function_exists('Kirki\Ecommerce\user')) {
    /**
     * Get the user instance.
     *
     * @return User
     */
    function user($user_id = null)
    {
        return app()->make(User::class, ['user_id' => $user_id]);
    }
}

if (!function_exists('Kirki\Ecommerce\customer')) {
    /**
     * Get the customer instance.
     *
     * @return Customer
     */
    function customer($user_id = null, $customer_id = null)
    {
        return app()->make(Customer::class, ['user_id' => $user_id, 'customer_id' => $customer_id]);
    }
}

if (!function_exists('Kirki\Ecommerce\settings')) {
    /**
     * Get the settings instance.
     *
     * @param string $key
     * @return AppSettings
     */
    function settings($key)
    {
        return Settings::get($key);
    }
}

if (!function_exists('Kirki\Ecommerce\response')) {
    /**
     * Get the response instance.
     *
     * @return Response
     */
    function response()
    {
        return app()->make(Response::class)->with_headers([
            'X-Content-Type-Options' => 'nosniff',
            'X-Frame-Options' => 'SAMEORIGIN',
            'X-XSS-Protection' => '1; mode=block',
            'Referrer-Policy' => 'no-referrer-when-downgrade',
            'Cache-Control' => 'public, max-age=60, stale-while-revalidate=30',
        ]);
    }
}

if (!function_exists('Kirki\Ecommerce\with_prefix')) {
    /**
     * Get the key with prefix applied.
     *
     * @param string $key
     * @return string
     */
    function with_prefix(string $key)
    {
        $prefix = app()->prefix();

        if (Str::starts_with($key, $prefix)) {
            return $key;
        }

        return $prefix . $key;
    }
}

if (!function_exists('Kirki\Ecommerce\without_prefix')) {
    /**
     * Get the key without prefix applied.
     *
     * @param string $key
     * @return string
     */
    function without_prefix(string $key)
    {
        $prefix = app()->prefix();

        if (!Str::starts_with($key, $prefix)) {
            return $key;
        }

        return substr($key, strlen($prefix));
    }
}


if (!function_exists('Kirki\Ecommerce\redirect')) {
    /**
     * Redirect to the given location.
     */
    function redirect($location)
    {
        Url::redirect($location);
    }
}

if (!function_exists('Kirki\Ecommerce\is_valid_json')) {
    /**
     * Check if the string is a valid JSON.
     * 
     * @param string $string
     * @return bool
     */
    function is_valid_json($string)
    {
        if (!is_string($string)) {
            return false;
        }

        json_decode($string);

        return (json_last_error() === JSON_ERROR_NONE);
    }
}

if (!function_exists('Kirki\Ecommerce\clean_path')) {
    /**
     * Clean and normalize file paths for consistency.
     *
     * @param string $path
     * @param bool   $trailing_slash Add a trailing slash? Default true.
     * @return string
     */
    function clean_path(string $path, bool $trailing_slash = true)
    {
        $path = wp_normalize_path($path);
        return $trailing_slash ? trailingslashit($path) : untrailingslashit($path);
    }
}

if (!function_exists('Kirki\Ecommerce\uuid')) {
    /**
     * Generate a UUID.
     * 
     * @return string
     */
    function uuid()
    {
        return Utils::uuid();
    }
}

if (!function_exists('Kirki\Ecommerce\url')) {
    /**
     * Generate a URL.
     * 
     * @param string $url
     * @param array $query_vars
     * @return string
     */
    function url($url, $query_vars = [])
    {
        return Url::make($url, $query_vars);
    }
}

if (!function_exists('Kirki\Ecommerce\is_block_theme')) {
    /**
     * Check if the site is using a block template
     *
     * This function will return true if the site is using a block template and false otherwise.
     *
     * @return bool True if the site is using a block template, false otherwise.
     */
    function is_block_theme()
    {
        return function_exists('wp_is_block_theme') && wp_is_block_theme();
    }
}

if (!function_exists('Kirki\Ecommerce\migrator')) {
    /**
     * Get the migrator instance.
     *
     * @return Migrator
     */
    function migrator()
    {
        return app()->make(Migrator::class);
    }
}

if (!function_exists('Kirki\Ecommerce\decision_engine')) {
    /**
     * Get the decision engine instance.
     *
     * @return DecisionEngine
     */
    function decision_engine()
    {
        return app()->make(DecisionEngine::class);
    }
}

if (!function_exists('Kirki\Ecommerce\tap')) {
    /**
     * Call the given Closure with the given value.
     *
     * @param  mixed  $value
     * @param  \Closure  $callback
     * @return mixed
     */
    function tap($value, $callback = null)
    {
        if (is_null($callback)) {
            return new HigherOrderTapProxy($value);
        }

        $callback($value);

        return $value;
    }
}

if (!function_exists('Kirki\Ecommerce\faker')) {
    /**
     * Get the fake instance.
     *
     * @return \Faker\Generator
     */
    function faker()
    {
        return app()->make(\Faker\Factory::class);
    }
}

if (!function_exists('Kirki\Ecommerce\dd')) {
    /**
     * Dump and die
     * 
     * @param mixed ...$args
     * @return never
     */
    function dd(...$args)
    {
        echo '<xmp>';
        foreach ($args as $arg) {
            echo "\n";
            var_dump($arg);
            echo "\n";
        }
        echo '</xmp>';
        die();
    }
}

if (!function_exists('Kirki\Ecommerce\pr')) {
    /**
     * print and die
     * 
     * @param mixed ...$args
     * @return never
     */
    function pr(...$args)
    {
        echo '<xmp>';
        foreach ($args as $arg) {
            echo "\n";
            print_r($arg);
            echo "\n";
        }
        echo '</xmp>';
        die();
    }
}

if (!function_exists('Kirki\Ecommerce\app_path')) {
    /**
     * Get the path to the application directory.
     *
     * @param string $path
     * @return string
     */
    function app_path($path = '')
    {
        return app()->path($path);
    }
}

if (!function_exists('Kirki\Ecommerce\config_path')) {
    /**
     * Get the path to the config directory.
     *
     * @param string $path
     * @return string
     */
    function config_path($path = '')
    {
        return app()->config_path($path);
    }
}

if (!function_exists('Kirki\Ecommerce\database_path')) {
    /**
     * Get the path to the database directory.
     *
     * @param string $path
     * @return string
     */
    function database_path($path = '')
    {
        return app()->database_path($path);
    }
}

if (!function_exists('Kirki\Ecommerce\base_path')) {
    /**
     * Get the path to the base directory.
     *
     * @param string $path
     * @return string
     */
    function base_path($path = '')
    {
        return app()->base_path($path);
    }
}

if (!function_exists('Kirki\Ecommerce\resource_path')) {
    /**
     * Get the path to the resources directory.
     *
     * @param string $path
     * @return string
     */
    function resource_path($path = '')
    {
        return app()->resource_path($path);
    }
}

if (!function_exists('Kirki\Ecommerce\bootstrap_path')) {
    /**
     * Get the path to the bootstrap directory.
     *
     * @param string $path
     * @return string
     */
    function bootstrap_path($path = '')
    {
        return app()->bootstrap_path($path);
    }
}

if (!function_exists('Kirki\Ecommerce\collection')) {
    /**
     * Create a collection instance from an array.
     *
     * @param array $array
     * @return Collection
     */
    function collection(array $array = [])
    {
        return new Collection($array);
    }
}

if (!function_exists('Kirki\Ecommerce\resource_url')) {
    /**
     * Get the path to the resources directory.
     *
     * @param string $path
     * @return string
     */
    function resource_url($path = '')
    {
        return app()->base_url(path_join('resources', $path));
    }
}

if (!function_exists('Kirki\Ecommerce\base_currency')) {
    /**
     * Get the base currency object/model.
     *
     * @return Currency|null
     */
    function base_currency()
    {
        return app()->make(CurrencyService::class)->get_base_currency();
    }
}

if (!function_exists('Kirki\Ecommerce\json_decoded_data')) {
    /**
     * Get the decoded JSON data from a file.
     * 
     * @param string $file_path
     * @param bool $associative
     * @return mixed
     */
    function json_decoded_data(string $file_path, bool $associative = true)
    {
        if (!file_exists($file_path)) {
            return null;
        }

        $content = file_get_contents($file_path);

        return json_decode($content, $associative);
    }
}
