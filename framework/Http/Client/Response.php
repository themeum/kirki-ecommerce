<?php

namespace Kirki\Ecommerce\Http\Client;

use ArrayAccess;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Concerns\DeepGettable;
use Exception;

use function Kirki\Ecommerce\collection;

defined('ABSPATH') || exit;

class Response implements ArrayAccess
{
    use DeepGettable;
    /**
     * The raw response data.
     * 
     * @var array|\WP_Error
     */
    protected $response;

    /**
     * The decoded JSON response.
     * 
     * @var array|null
     */
    protected $decoded;

    /**
     * The response cookies.
     * 
     * @var array|null
     */
    protected $cookies;

    /**
     * Create a new response instance.
     * 
     * @param array|\WP_Error $response
     */
    public function __construct($response)
    {
        $this->response = $response;
    }

    /**
     * Get the body of the response.
     * 
     * @return string
     */
    public function body()
    {
        return wp_remote_retrieve_body($this->response);
    }

    /**
     * Get the JSON decoded body of the response as an associative array.
     * 
     * @param string|null $key
     * @param mixed $default
     * @return mixed
     */
    public function json($key = null, $default = null)
    {
        if (!$this->decoded) {
            $this->decoded = json_decode($this->body(), true);
        }

        if (is_null($key)) {
            return $this->decoded;
        }

        return $this->deep_get($this->decoded, $key, $default);
    }

    /**
     * Get the JSON decoded body of the response as an object.
     * 
     * @return object|null
     */
    public function object()
    {
        return json_decode($this->body(), false);
    }

    /**
     * Get the JSON decoded body of the response as a collection.
     * 
     * @param string|null $key
     * @return \Kirki\Ecommerce\Collections\Collection
     */
    public function collect($key = null)
    {
        return collection($this->json($key));
    }

    /**
     * Get a header from the response.
     * 
     * @param string $name
     * @return string
     */
    public function header($name)
    {
        return wp_remote_retrieve_header($this->response, $name);
    }

    /**
     * Get all headers from the response.
     * 
     * @return array
     */
    public function headers()
    {
        return wp_remote_retrieve_headers($this->response)->getAll();
    }

    /**
     * Get the cookies from the response.
     * 
     * @return array
     */
    public function cookies()
    {
        return wp_remote_retrieve_cookies($this->response);
    }

    /**
     * Get the status code of the response.
     * 
     * @return int
     */
    public function status()
    {
        return (int) wp_remote_retrieve_response_code($this->response);
    }

    /**
     * Get the reason phrase of the response.
     * 
     * @return string
     */
    public function reason()
    {
        return wp_remote_retrieve_response_message($this->response);
    }

    /**
     * Determine if the response status code was successful (2xx).
     * 
     * @return bool
     */
    public function successful()
    {
        return $this->status() >= 200 && $this->status() < 300;
    }

    /**
     * Determine if the response status code was a redirection (3xx).
     * 
     * @return bool
     */
    public function redirected()
    {
        return $this->status() >= 300 && $this->status() < 400;
    }

    /**
     * Determine if the response status code was a client error (4xx).
     * 
     * @return bool
     */
    public function client_error()
    {
        return $this->status() >= 400 && $this->status() < 500;
    }

    /**
     * Determine if the response status code was a server error (5xx).
     * 
     * @return bool
     */
    public function server_error()
    {
        return $this->status() >= 500;
    }

    /**
     * Determine if the response status code was a client or server error.
     * 
     * @return bool
     */
    public function failed()
    {
        return $this->server_error() || $this->client_error();
    }

    /**
     * Execute the given callback if the response has a failed status code.
     * 
     * @param callable $callback
     * @return $this
     */
    public function on_error(callable $callback)
    {
        if ($this->failed()) {
            $callback($this);
        }

        return $this;
    }

    /**
     * Determine if the given offset exists in the JSON response.
     * 
     * @param mixed $offset
     * @return bool
     */
    public function offsetExists($offset): bool
    {
        return isset($this->json()[$offset]);
    }

    /**
     * Get the value at the given offset from the JSON response.
     * 
     * @param mixed $offset
     * @return mixed
     */
    public function offsetGet($offset): mixed
    {
        return $this->json()[$offset];
    }

    /**
     * Set the value at the given offset.
     * 
     * @param mixed $offset
     * @param mixed $value
     * @return void
     * @throws \Exception
     */
    public function offsetSet($offset, $value): void
    {
        throw new Exception('Response data may not be mutated using array access.');
    }

    /**
     * Unset the value at the given offset.
     * 
     * @param mixed $offset
     * @return void
     * @throws \Exception
     */
    public function offsetUnset($offset): void
    {
        throw new Exception('Response data may not be mutated using array access.');
    }

    /**
     * Get the body of the response as a string.
     * 
     * @return string
     */
    public function __toString()
    {
        return $this->body();
    }
}
