<?php

namespace Kirki\Ecommerce\Supports\Facades;

use Kirki\Ecommerce\Facade;


/**
 * @method static \Kirki\Ecommerce\Http\Client\Response get(string $url, array $options = [])
 * @method static \Kirki\Ecommerce\Http\Client\Response post(string $url, array $options = [])
 * @method static \Kirki\Ecommerce\Http\Client\Response put(string $url, array $options = [])
 * @method static \Kirki\Ecommerce\Http\Client\Response patch(string $url, array $options = [])
 * @method static \Kirki\Ecommerce\Http\Client\Response delete(string $url, array $options = [])
 * @method static \Kirki\Ecommerce\Http\Client\Response head(string $url, array $options = [])
 * @method static \Kirki\Ecommerce\Http\Client\Response options(string $url, array $options = [])
 * @method static \Kirki\Ecommerce\Http\Client\Request with_headers(array $headers)
 * @method static \Kirki\Ecommerce\Http\Client\Request with_url_parameters(array $parameters)
 * @method static \Kirki\Ecommerce\Http\Client\Request with_body($content, $type = 'application/json')
 * @method static \Kirki\Ecommerce\Http\Client\Request with_token(string $token, $type = 'Bearer')
 * @method static \Kirki\Ecommerce\Http\Client\Request with_user_agent($user_agent)
 * @method static \Kirki\Ecommerce\Http\Client\Request without_verifying()
 * @method static \Kirki\Ecommerce\Http\Client\Request accept($value)
 * @method static \Kirki\Ecommerce\Http\Client\Request accept_json()
 * @method static \Kirki\Ecommerce\Http\Client\Request body_format(string $format)
 * @method static \Kirki\Ecommerce\Http\Client\Request as_json()
 * @method static \Kirki\Ecommerce\Http\Client\Request as_form()
 * @method static \Kirki\Ecommerce\Http\Client\Request as_multipart()
 * @method static \Kirki\Ecommerce\Http\Client\Request method(string $method)
 * @method static \Kirki\Ecommerce\Http\Client\Request attach(string $name, string $content, ?string $filename = null, array $headers = [])
 * @method static \Kirki\Ecommerce\Http\Client\Request macro($name, callable $macro)
 * 
 * @see \Kirki\Ecommerce\Http\Client\Request
 */
class Http extends Facade
{
    protected static $is_cacheable = false;

    public static function get_accessor()
    {
        return 'client-request';
    }
}
