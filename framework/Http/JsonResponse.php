<?php

namespace Kirki\Ecommerce\Http;

use Kirki\Ecommerce\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Contracts\Support\Jsonable;
use Kirki\Ecommerce\Supports\Arr;
use InvalidArgumentException;
use JsonSerializable;
use WP_REST_Response;

class JsonResponse extends WP_REST_Response
{
    /**
     * The original data that was passed to the response.
     *
     * @var mixed
     */
    protected $original;

    /**
     * The content of the response.
     *
     * @var string
     */
    protected $content;

    /**
     * The encoding options for the response.
     *
     * @var int
     */
    protected $encoding_options = 0;

    /**
     * Create a new JSON response instance.
     *
     * @param mixed $data The data to be encoded as JSON
     * @param int $status The HTTP status code
     * @param array $headers The headers to be sent with the response
     * @param int $options The JSON encoding options
     */
    public function __construct($data = [], $status = 200, array $headers = [], int $options = 0)
    {
        $this->original = $data;
        $this->status = $status;
        $this->headers = $headers;
        $this->encoding_options = $options;

        $this->set_content($data);
        $this->set_status($status);
        $this->set_headers($headers);

        $this->set_data($this->get_content());
    }

    /**
     * Set the encoding options for the response.
     *
     * @param int $option The JSON encoding options
     * @return $this The response instance for method chaining
     */
    public function set_encoding_options($option)
    {
        $this->encoding_options = (int) $option;

        return $this->set_content($this->get_content());
    }

    /**
     * Get the encoding options for the response.
     *
     * @return int The JSON encoding options
     */
    public function get_encoding_options()
    {
        return $this->encoding_options;
    }

    /**
     * Get the content of the response.
     *
     * @param bool $assoc Whether to return the content as an associative array
     * @param int $depth The maximum depth of the content
     * @return mixed The content of the response
     */
    public function get_content($assoc = false, $depth = 512)
    {
        $status_code = (int) $this->get_status();

        $success = $status_code >= 200 && $status_code < 300;
        $content = json_decode($this->content, $assoc, $depth);

        if (!$assoc) {
            $content->success = $success;
            return $content;
        }

        return array_merge(['success' => $success], $content);
    }

    /**
     * Set the content of the response.
     *
     * @param mixed $data The data to be encoded as JSON
     * @return $this The response instance for method chaining
     */
    public function set_content($data)
    {
        $this->original = $data;

        // Clear the json error stack
        json_decode('[]');

        switch (true) {
            case $data instanceof Jsonable:
                $this->content = $data->to_json($this->encoding_options);
                break;
            case $data instanceof JsonSerializable:
                $this->content = Arr::json_encode($data->jsonSerialize(), $this->encoding_options);
                break;
            case $data instanceof Arrayable:
                $this->content = Arr::json_encode($data->to_array(), $this->encoding_options);
                break;
            default:
                $this->content = Arr::json_encode($data, $this->encoding_options);
                break;
        }

        if (!$this->is_valid_json(json_last_error())) {
            throw new InvalidArgumentException(json_last_error_msg());
        }

        return $this;
    }

    /**
     * Check if the JSON is valid.
     *
     * @param int $json_error The JSON error code
     * @return bool Whether the JSON is valid
     */
    protected function is_valid_json($json_error)
    {
        if ($json_error === JSON_ERROR_NONE) {
            return true;
        }

        return $this->has_encoding_options(JSON_PARTIAL_OUTPUT_ON_ERROR) &&
            in_array($json_error, [
                JSON_ERROR_RECURSION,
                JSON_ERROR_INF_OR_NAN,
                JSON_ERROR_UNSUPPORTED_TYPE,
            ]);
    }

    /**
     * Check if the encoding options have a specific option set.
     *
     * @param int $option The option to check
     * @return bool Whether the option is set
     */
    protected function has_encoding_options($option)
    {
        return (bool) ($this->encoding_options & $option);
    }
}
