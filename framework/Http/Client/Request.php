<?php

namespace Kirki\Ecommerce\Http\Client;

use BadMethodCallException;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Supports\Arr;
use Kirki\Ecommerce\Supports\Str;
use Kirki\Ecommerce\Supports\Traits\Macroable;
use RuntimeException;

use function Kirki\Ecommerce\collection;

class Request
{
    /**
     * The macroable trait.
     *
     * @var Macroable
     */
    use Macroable {
        __call as call_macro;
    }

    /**
     * HTTP GET method.
     */
    public const GET = 'GET';

    /**
     * HTTP POST method.
     */
    public const POST = 'POST';

    /**
     * HTTP PUT method.
     */
    public const PUT = 'PUT';

    /**
     * HTTP PATCH method.
     */
    public const PATCH = 'PATCH';

    /**
     * HTTP DELETE method.
     */
    public const DELETE = 'DELETE';

    /**
     * HTTP HEAD method.
     */
    public const HEAD = 'HEAD';

    /**
     * HTTP OPTIONS method.
     */
    public const OPTIONS = 'OPTIONS';

    /**
     * The base URL for the request.
     *
     * @var string
     */
    protected string $base_url = '';

    /**
     * The options for the request.
     *
     * @var array
     */
    protected array $options = [];

    /**
     * The body format for the request.
     *
     * @var string
     */
    protected string $body_format;

    /**
     * The content for the request.
     *
     * @var mixed
     */
    protected $content = null;

    /**
     * The files for the request.
     *
     * @var array
     */
    protected $files = [];

    /**
     * The HTTP methods for the request.
     *
     * @var array
     */
    protected array $methods = [
        self::GET,
        self::POST,
        self::PUT,
        self::PATCH,
        self::DELETE,
        self::HEAD,
        self::OPTIONS,
    ];

    /**
     * The constructor.
     */
    public function __construct()
    {
        $this->options = [
            'method' => 'GET',
            'timeout' => 30,
            'redirection' => 5,
            'httpversion' => '1.0',
            'reject_unsafe_url' => false,
            'blocking' => true,
            'cookies' => [],
            'body' => null,
            'compress' => false,
            'decompress' => true,
            'sslverify' => true,
            'stream' => false,
            'filename' => null,
            'limit_response_size' => null,
            'headers' => [],
        ];

        $this->as_json();
    }

    /**
     * Set the base URL for the request.
     *
     * @param string $url
     * @return $this
     */
    public function base_url(string $url)
    {
        $this->base_url = $url;

        return $this;
    }

    /**
     * Get the base URL for the request.
     *
     * @return string
     */
    public function get_base_url()
    {
        return $this->base_url;
    }

    /**
     * Set the headers for the request.
     *
     * @param array $headers
     * @return $this
     */
    public function with_headers(array $headers)
    {
        $this->options = array_merge_recursive($this->options, [
            'headers' => $headers,
        ]);

        return $this;
    }

    /**
     * Replace the headers for the request.
     *
     * @param array $headers
     * @return $this
     */
    public function replace_headers(array $headers)
    {
        $this->options['headers'] = array_merge(
            $this->options['headers'] ?? [],
            $headers
        );

        return $this;
    }

    /**
     * Set the token for the request.
     *
     * @param string $token
     * @param string $type
     * @return $this
     */
    public function with_token(string $token, $type = 'Bearer')
    {
        return $this->with_headers([
            'Authorization' => trim($type . ' ' . $token),
        ]);
    }

    /**
     * Set the user agent for the request.
     *
     * @param string $user_agent
     * @return $this
     */
    public function with_user_agent($user_agent)
    {
        return $this->with_headers([
            'User-Agent' => trim($user_agent),
        ]);
    }

    /**
     * Disable SSL verification for the request.
     *
     * @return $this
     */
    public function without_verifying()
    {
        $this->options['sslverify'] = false;

        return $this;
    }

    /**
     * Set the method for the request.
     *
     * @param string $method
     * @return $this
     */
    public function method($method)
    {
        $this->options['method'] = $method;

        return $this;
    }

    /**
     * Set the accept header for the request.
     *
     * @param string $value
     * @return $this
     */
    public function accept($value)
    {
        return $this->with_headers([
            'Accept' => $value,
        ]);
    }

    /**
     * Set the accept header for the request to JSON.
     *
     * @return $this
     */
    public function accept_json()
    {
        return $this->accept('application/json');
    }

    /**
     * Set the body format for the request.
     *
     * @param string $format
     * @return $this
     */
    public function body_format(string $format)
    {
        $this->body_format = $format;

        return $this;
    }

    /**
     * Set the body for the request.
     *
     * @param mixed $content
     * @param string $type
     * @return $this
     */
    public function with_body($content, $type = 'application/json')
    {
        $this->body_format = 'body';

        $this->content = $content;

        $this->content_type($type);

        return $this;
    }

    /**
     * Set the body format for the request to JSON.
     *
     * @return $this
     */
    public function as_json()
    {
        return $this->body_format('json')->content_type('application/json');
    }

    /**
     * Set the body format for the request to form.
     *
     * @return $this
     */
    public function as_form()
    {
        return $this->body_format('form')->content_type('application/x-www-form-urlencoded');
    }

    /**
     * Set the body format for the request to multipart.
     *
     * @return $this
     */
    public function as_multipart()
    {
        return $this->body_format('multipart')->content_type('multipart/form-data');
    }

    /**
     * Attach a file to the request.
     *
     * @param string $name
     * @param string $path
     * @param string $filename
     * @return $this
     */
    public function attach($name, $contents = '', $filename = null, array $headers = [])
    {
        if (is_array($name)) {
            foreach ($name as $file) {
                $this->attach(...$file);
            }

            return $this;
        }

        $this->as_multipart();

        $this->files[] = array_filter([
            'name' => $name,
            'contents' => $contents,
            'headers' => $headers,
            'filename' => $filename,
        ]);

        return $this;
    }

    /**
     * Set the content type for the request.
     *
     * @param string $type
     * @return $this
     */
    public function content_type($type)
    {
        $this->options['headers'] ??= [];
        $this->options['headers']['Content-Type'] = $type;

        return $this;
    }

    /**
     * Set the timeout for the request.
     *
     * @param int $seconds
     * @return $this
     */
    public function timeout($seconds)
    {
        $this->options['timeout'] = $seconds;

        return $this;
    }

    /**
     * Set the options for the request.
     *
     * @param array $options
     * @return $this
     */
    public function with_options(array $options)
    {
        $this->options = array_replace_recursive(
            array_merge_recursive($this->options, Arr::only($options, ['headers', 'json', 'multipart', 'query', 'cookies'])),
            $options
        );

        return $this;
    }

    /**
     * Set the body for the request.
     *
     * @param mixed $data
     * @return $this
     */
    protected function with_data($data)
    {
        $this->options['body'] = $data;

        return $this;
    }

    /**
     * Send a GET request.
     *
     * @param string $url
     * @param array $query
     * @return Response
     */
    public function get(string $url, $query = null)
    {
        return $this->send('GET', $url, func_num_args() === 1 ? [] : [
            'query' => $query
        ]);
    }

    /**
     * Send a HEAD request.
     *
     * @param string $url
     * @param array $query
     * @return Response
     */
    public function head(string $url, $query = null)
    {
        return $this->send('HEAD', $url, func_num_args() === 1 ? [] : [
            'query' => $query
        ]);
    }

    /**
     * Send a POST request.
     *
     * @param string $url
     * @param array $data
     * @return Response
     */
    public function post(string $url, $data = [])
    {
        return $this->send('POST', $url, func_num_args() === 1 ? [] : [
            $this->body_format => $data
        ]);
    }

    /**
     * Send a PUT request.
     *
     * @param string $url
     * @param array $data
     * @return Response
     */
    public function put(string $url, $data = [])
    {
        return $this->send('PUT', $url, func_num_args() === 1 ? [] : [
            $this->body_format => $data
        ]);
    }

    /**
     * Send a PATCH request.
     *
     * @param string $url
     * @param array $data
     * @return Response
     */
    public function patch(string $url, $data = [])
    {
        return $this->send('PATCH', $url, func_num_args() === 1 ? [] : [
            $this->body_format => $data
        ]);
    }

    /**
     * Send a DELETE request.
     *
     * @param string $url
     * @param array $data
     * @return Response
     */
    public function delete(string $url, $data = [])
    {
        return $this->send('DELETE', $url, func_num_args() === 1 ? [] : [
            $this->body_format => $data
        ]);
    }

    /**
     * Send an OPTIONS request.
     *
     * @param string $url
     * @param array $data
     * @return Response
     */
    public function options(string $url, $data = [])
    {
        return $this->send('OPTIONS', $url, func_num_args() === 1 ? [] : [
            $this->body_format => $data
        ]);
    }

    /**
     * Send a request.
     *
     * @param string $method
     * @param string $url
     * @param array $options
     * @return Response
     */
    public function send(string $method, string $url, array $options = [])
    {
        if (!Str::starts_with($url, ['http', 'https'])) {
            $url = ltrim(
                rtrim($this->base_url, '/') . '/' . ltrim($url, '/'),
                '/'
            );
        }

        $this->method($method);

        return $this->send_request($method, $url, $options);
    }

    /**
     * Send a request.
     *
     * @param string $method
     * @param string $url
     * @param array $options
     * @return Response
     */
    protected function send_request(string $method, string $url, array $options = [])
    {
        if (!$this->is_valid_method($method)) {
            throw new RuntimeException(sprintf(__('Invalid HTTP method: %s', 'kirki-ecommerce'), $method));
        }

        $data = $this->parse_request_data($method, $url, $options);
        $url = $this->prepare_request_url($method, $url, $data);
        $body = $this->prepare_request_body($method, $data);
        $args = $this->prepare_request_args($body);

        $response = wp_remote_request($url, $args);

        return $this->new_response($response);
    }

    protected function prepare_request_url(string $method, string $url, array $data)
    {
        if (!in_array($method, ['GET', 'HEAD'])) {
            return $url;
        }

        if (empty($data)) {
            return $url;
        }

        return $url . '?' . http_build_query($data);
    }

    /**
     * Create a new response instance.
     *
     * @param array $response
     * @return Response
     */
    protected function new_response($response)
    {
        return new Response($response);
    }

    /**
     * Parse the request data.
     *
     * @param string $method
     * @param string $url
     * @param array $options
     * @return array
     */
    protected function parse_request_data(string $method, string $url, array $options = [])
    {
        if ($this->body_format === 'body') {
            return [];
        }

        $request_data = $options[$this->body_format] ?? $options['query'] ?? [];

        if (empty($request_data) && $method === 'GET' && str_contains($url, '?')) {
            $request_data = substr($url, strpos($url, '?') + 1);
        }

        if (is_string($request_data)) {
            parse_str($request_data, $parsed_data);
            $request_data = is_array($parsed_data) ? $parsed_data : [];
        }

        return is_array($request_data) ? $request_data : [];
    }

    /**
     * Prepare the request body.
     *
     * @param array $data
     * @return string|array
     */
    protected function prepare_request_body(string $method, array $data)
    {
        if (in_array($method, ['GET', 'HEAD'])) {
            return [];
        }

        switch ($this->body_format) {
            case 'json':
                return empty($data) ? '' : Arr::json_encode($data);
            case 'body':
                return $this->content ?? [];
            case 'form':
                return $data;
            case 'multipart':
                return $this->make_multipart_body($data);
            default:
                throw new RuntimeException(
                    sprintf(__('Invalid body format: %s', 'kirki-ecommerce'), $this->body_format)
                );
        }
    }

    /**
     * Make a multipart body.
     *
     * @param array $data
     * @return string
     */
    protected function make_multipart_body(array $data)
    {
        $data = $this->prepare_multipart_data($data);
        $stream = new MultipartStream(
            $data
        );
        $boundary = $stream->boundary();

        $this->content_type("multipart/form-data; boundary={$boundary}");

        return $stream->payload();
    }

    /**
     * Prepare the multipart data.
     *
     * @param array $data
     * @return array
     */
    protected function prepare_multipart_data(array $data)
    {
        return collection($data)->flat_map(function ($item, $key) {
            if (is_array($item)) {
                if (isset($item['name']) && isset($item['contents'])) {
                    return $item;
                }

                return collection($item)->map(fn($value) => [
                    'name' => $key . '[]',
                    'contents' => $value,
                ])->all();
            }

            return [
                [
                    'name' => $key,
                    'contents' => $item,
                ]
            ];
        })->values()->merge($this->files ?? [])->all();
    }


    /**
     * Prepare the request arguments.
     *
     * @param array $data
     * @return array
     */
    protected function prepare_request_args($data)
    {
        return array_merge($this->options, [
            'body' => $data ?: null,
        ]);
    }

    /**
     * Check if the method is valid.
     *
     * @param string $method
     * @return bool
     */
    protected function is_valid_method(string $method)
    {
        return in_array(strtoupper($method), $this->methods, true);
    }

    /**
     * Call a macro.
     *
     * @param string $method
     * @param array $parameters
     * @return mixed
     */
    public function __call($method, $parameters)
    {
        if (static::has_macro($method)) {
            return $this->call_macro($method, $parameters);
        }

        throw new BadMethodCallException(
            sprintf(__('Call to undefined method %s::%s', 'kirki-ecommerce'), static::class, $method)
        );
    }
}
