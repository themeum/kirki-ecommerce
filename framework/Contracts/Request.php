<?php

namespace Kirki\Ecommerce\Contracts;

/**
 * Contract for interacting with an HTTP request in a normalized way.
 *
 * This interface abstracts key methods for accessing request data, headers, routes, and HTTP method.
 *
 * @since 1.0.0
 */
interface Request
{
    /**
     * Get the HTTP method of the request (GET, POST, etc).
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_method();

    /**
     * Get the requested route or endpoint.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_route();

    /**
     * Get all HTTP headers from the request.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function get_headers();

    /**
     * Get all request input attributes.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function all();

    /**
     * Validate the request data against the given rules.
     *
     * @since 1.0.0
     *
     * @param array $rules The validation rules.
     * @return array|null
     */
    public function validate(array $rules);

    /**
     * Get the validated data from the request.
     *
     * @since 1.0.0
     *
     * @return array|null
     */
    public function validated();

    /**
     * Sanitize the request data.
     *
     * @since 1.0.0
     *
     * @param array $filters The filters to apply.
     * @return array
     */
    public function sanitize(array $filters = []);

    /**
     * Get the sanitized data from the request.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function sanitized();

    /**
     * Get request data excluding specified attributes.
     *
     * @since 1.0.0
     *
     * @param array $attributes Keys to exclude.
     * @return array
     */
    public function except(array $attributes);

    /**
     * Get a single attribute by key.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @return mixed|null
     */
    public function only(string $key);

    /**
     * Alias of `only()`. Get input value by key.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @return mixed|null
     */
    public function input(string $key);

    /**
     * Get a value from the request with optional default and type casting.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param mixed  $default Default value if the key doesn't exist.
     * @param string|null $type Optional type to cast the result to: int, float, bool, string, array with proper sanitization.
     * @return mixed
     */
    public function get(string $key, $default = null, $type = null);

    /** 
     * Check if the request has the provided key
     * 
     * @since 1.0.0
     * 
     * @param string $key
     * @return bool
     */
    public function has(string $key);

    /**
     * Get a string value.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string
     */
    public function get_string(string $key, $default = null);

    /**
     * Get a safe input value with whitelist.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param mixed  $default Default value if the key doesn't exist.
     * @param array $whitelist Array of allowed values.
     * @return mixed
     */
    public function get_whitelisted(string $key, $default = null, array $whitelist = []);

    /**
     * Get a date value.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string
     */
    public function get_date(string $key, $default = null);

    /**
     * Get a datetime value.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string
     */
    public function get_datetime(string $key, $default = null);

    /**
     * Get a text with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_text(string $key, $default = null);

    /**
     * Get a html supported content with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_html(string $key, $default = null);

    /**
     * Get a email with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_email(string $key, $default = null);

    /**
     * Get a url with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_url(string $key, $default = null);

    /**
     * Get a key value with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_key(string $key, $default = null);

    /**
     * Get a title value with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_title(string $key, $default = null);

    /**
     * Get a file name with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_file_name(string $key, $default = null);

    /**
     * Get mime type with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_mime_type(string $key, $default = null);

    /**
     * Get an integer value.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param int|null  $default Default value if the key doesn't exist.
     * @return int|null
     */
    public function get_int(string $key, $default = null);

    /**
     * Get a boolean value.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param bool  $default Default value if the key doesn't exist.
     * @return bool
     */
    public function get_bool(string $key, bool $default = false);

    /**
     * Get a float value.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param float|null  $default Default value if the key doesn't exist.
     * @return float|null
     */
    public function get_float(string $key, $default = null);


    /**
     * Get a money for storage.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param float $default Default value if the key doesn't exist.
     * @return float
     */
    public function get_money(string $key, $default = 0);

    /**
     * Get an array value.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param array|null $default Default value if the key doesn't exist.
     * @return array|null
     */
    public function get_array(string $key, $default = null);
}
