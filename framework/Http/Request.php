<?php

namespace Kirki\Ecommerce\Http;

use Kirki\Ecommerce\Contracts\Request as RequestContract;
use Kirki\Ecommerce\Contracts\Support\Arrayable;
use Kirki\Ecommerce\Sanitizer;
use Kirki\Ecommerce\Exceptions\AuthorizationException;
use Kirki\Ecommerce\Validation\Validator;
use WP_REST_Request;

use function Kirki\Ecommerce\user;

/**
 * Handles REST API request data abstraction for Ecommerce operations.
 *
 * @since 1.0.0
 */
class Request implements RequestContract, Arrayable
{
    /**
     * The request's input attributes.
     *
     * @since 1.0.0
     * @var array
     */
    protected $attributes = [];

    /**
     * The HTTP method used for the request (e.g. GET, POST).
     *
     * @since 1.0.0
     * @var string
     */
    protected $method;

    /**
     * The route URI for the request.
     *
     * @since 1.0.0
     * @var string
     */
    protected $route;

    /**
     * The headers associated with the request.
     *
     * @since 1.0.0
     * @var array
     */
    protected $headers;

    /**
     * Magic getter to retrieve request attributes.
     *
     * @since 1.0.0
     *
     * @param string $name The name of the attribute.
     * @return mixed|null The attribute value or null if not set.
     */
    public function __get(string $name)
    {
        return $this->attributes[$name] ?? null;
    }

    /**
     * Magic setter to set request attributes.
     *
     * @since 1.0.0
     *
     * @param string $name  The name of the attribute.
     * @param mixed  $value The value to assign.
     * @return void
     */
    public function __set(string $name, $value)
    {
        $this->attributes[$name] = $value;
    }

    /**
     * Create a new Request instance from a WP_REST_Request.
     *
     * @since 1.0.0
     *
     * @param WP_REST_Request $request The WordPress REST request object.
     * @return self
     */
    public static function from_wp_rest_request(WP_REST_Request $request)
    {
        return (new static)->make_request($request);
    }

    /**
     * Make a new request instance from a WP_REST_Request.
     *
     * @since 1.0.0
     *
     * @param WP_REST_Request $request The WordPress REST request object.
     * @return self
     */
    public function make_request(WP_REST_Request $request)
    {
        $this->attributes = array_merge(
            $this->attributes,
            $request->get_params(),
            $request->get_file_params()
        );
        $this->method = $request->get_method();
        $this->route = $request->get_route();
        $this->headers = $request->get_headers();

        return $this;
    }

    /**
     * Get the validation rules for the request.
     *
     * @since 1.0.0
     *
     * @return array
     */
    protected function rules()
    {
        return [];
    }

    /**
     * Validate the request data against the given rules.
     *
     * @since 1.0.0
     *
     * @param array $rules The validation rules.
     * @return array|null
     */
    public function validate(array $rules)
    {
        return $this->run_validation($rules);
    }

    /**
     * Get the validated data from the request.
     *
     * @since 1.0.0
     *
     * @throws \Ecommerce\Exceptions\ValidationException
     *
     * @return array|null
     */
    public function validated()
    {
        return $this->run_validation(
            $this->rules()
        );
    }

    /**
     * Run the validation on the request data.
     *
     * @since 1.0.0
     *
     * @param array $rules The validation rules.
     * @throws \Ecommerce\Exceptions\ValidationException
     *
     * @return array|null
     */
    protected function run_validation(array $rules)
    {
        $validator = Validator::make(
            $this->attributes(),
            $rules
        );

        if ($validator->validate()) {
            return $validator->validated();
        }

        return null;
    }

    /**
     * Define the sanitization filters for the request.
     * This will be defined into the extended request class.
     *
     * @since 1.0.0
     *
     * @return array<key:string,value:string|callable(mixed):mixed|array>
     */
    protected function filters()
    {
        return [];
    }

    /**
     * Sanitize the data.
     *
     * @since 1.0.0
     *
     * @param array $data The data to sanitize.
     * @param array $filters The filters to apply.
     * @return array
     */
    public function sanitize(array $filters = [])
    {
        return $this->run_sanitization($filters);
    }

    /**
     * Get the sanitized data.
     *
     * @since 1.0.0
     *
     * @param array $data The data to sanitize.
     * @return array
     */
    public function sanitized()
    {
        return $this->run_sanitization($this->filters());
    }

    /**
     * Run the sanitization on the data.
     *
     * @since 1.0.0
     *
     * @param array $filters The filters to apply.
     * @return array
     */
    protected function run_sanitization(array $filters)
    {
        return Sanitizer::make($this->attributes(), $filters)->get_sanitized_data();
    }

    /**
     * Get the validated and sanitized data.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function clean()
    {
        return $this->all();
    }

    /**
     * Get the current user instance from the request.
     *
     * @since 1.0.0
     *
     * @return \Ecommerce\Wordpress\User
     */
    public function user()
    {
        return user();
    }

    /**
     * Get the HTTP method used in the request.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_method()
    {
        return $this->method;
    }

    /**
     * Get the route URI of the request.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function get_route()
    {
        return $this->route;
    }

    /**
     * Get the headers associated with the request.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function get_headers()
    {
        return $this->headers;
    }

    /**
     * Get all input attributes.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function all()
    {
        $this->resolve_validation_and_sanitization();

        return $this->attributes;
    }

    /**
     * Get all input attributes.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function attributes()
    {
        if ($this->has('_method')) {
            $this->remove('_method');
        }

        return $this->attributes;
    }

    /**
     * Resolve the validation and sanitization.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function resolve_validation_and_sanitization()
    {
        if (!$this->authorize()) {
            throw new AuthorizationException(__('You are not authorized to make this request.', 'kirki-ecommerce'));
        }

        $this->prepare_for_validation();

        $this->run_validation($this->rules());
        $this->merge($this->sanitized());

        $this->passed_validation();
    }

    /**
     * Prepare the request data for validation.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function prepare_for_validation()
    {
        // Override this method to prepare the request data for validation.
    }

    /**
     * Handle the passed validation.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function passed_validation()
    {
        // Override this method to handle the passed validation.
    }

    /**
     * Determine if the user is authorized to make this request.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    protected function authorize()
    {
        return true;
    }

    /**
     * Merge the given input with the existing attributes.
     *
     * @since 1.0.0
     *
     * @param array $input The input to merge.
     * @return static
     */
    public function merge(array $input)
    {
        $this->attributes = array_merge(
            $this->attributes,
            $input
        );

        return $this;
    }


    /**
     * Check if an attribute exists.
     *
     * @since 1.0.0
     *
     * @param string $key The key of the attribute.
     * @return bool
     */
    public function has(string $key)
    {
        return isset($this->attributes[$key]);
    }

    /**
     * Remove an attribute.
     *
     * @since 1.0.0
     *
     * @param string $key The key of the attribute.
     * @return void
     */
    public function remove(string $key)
    {
        unset($this->attributes[$key]);
    }

    /**
     * Get all input attributes except the specified keys.
     *
     * @since 1.0.0
     *
     * @param array $attributes The attribute keys to exclude.
     * @return array
     */
    public function except(array $attributes)
    {
        return array_diff_key($this->attributes, array_flip($attributes));
    }

    /**
     * Get a single input attribute by key.
     *
     * @since 1.0.0
     *
     * @param string $key The key of the attribute.
     * @return mixed|null
     */
    public function only(string $key)
    {
        return $this->attributes[$key] ?? null;
    }

    /**
     * Alias for the `only()` method.
     *
     * @since 1.0.0
     *
     * @param string $key The key of the attribute.
     * @return mixed|null
     */
    public function input(string $key)
    {
        return $this->only($key);
    }

    /**
     * Get a value from the request with optional default and type casting.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param mixed $default Default value if the key doesn't exist.
     * @param string|null $type Optional type to cast the result to: int, float, bool, string, array with proper sanitization.
     * @return mixed|null
     */
    public function get(string $key, $default = null, $type = null)
    {
        $value = isset($this->attributes[$key]) ? $this->attributes[$key] : $default;

        $value = Sanitizer::apply_rule($value, $type);

        return $value;
    }

    /**
     * Get a value from the request with optional default and type casting.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param mixed $default Default value if the key doesn't exist.
     * @param array $whitelist Optional whitelist of allowed values.
     * @return mixed
     */
    public function get_whitelisted(string $key, $default = null, array $whitelist = [])
    {
        $value = $this->get($key);

        if (!in_array($value, $whitelist, true)) {
            return $default;
        }

        return $value;
    }

    /**
     * Get a string value with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param string|null $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_string(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::TEXT);
    }

    /**
     * Get a date value.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string
     */
    public function get_date(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::DATE);
    }

    /**
     * Get a datetime value.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string
     */
    public function get_datetime(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::DATETIME);
    }

    /**
     * Get a text with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param string|null $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_text(string $key, $default = null)
    {
        return $this->get_string($key, $default);
    }

    /**
     * Get a html supported content with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key     The key to retrieve.
     * @param string|null  $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_html(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::TEXTAREA);
    }

    /**
     * Get a email with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param string|null $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_email(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::EMAIL);
    }

    /**
     * Get a url with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param string|null $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_url(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::URL);
    }

    /**
     * Get a key value with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param string|null $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_key(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::KEY);
    }

    /**
     * Get a title value with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param string|null $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_title(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::TITLE);
    }

    /**
     * Get a file name with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param string|null $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_file_name(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::TITLE);
    }

    /**
     * Get mime type with sanitization applied.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param string|null $default Default value if the key doesn't exist.
     * @return string|null
     */
    public function get_mime_type(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::MIME_TYPE);
    }

    /**
     * Get an integer value.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param int|null $default Default value if the key doesn't exist.
     * @return int|null
     */
    public function get_int(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::INT);
    }

    /**
     * Get a boolean value.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param bool $default Default value if the key doesn't exist.
     * @return bool
     */
    public function get_bool(string $key, bool $default = false)
    {
        return $this->get($key, $default, Sanitizer::BOOL);
    }

    /**
     * Get a float value.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param float|null $default Default value if the key doesn't exist.
     * @return float|null
     */
    public function get_float(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::FLOAT);
    }

    /**
     * Get a money for storage.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param float $default Default value if the key doesn't exist.
     * @return float
     */
    public function get_money(string $key, $default = 0)
    {
        return $this->get($key, $default, Sanitizer::MONEY);
    }

    /**
     * Get an array value.
     *
     * @since 1.0.0
     *
     * @param string $key The key to retrieve.
     * @param array|null $default Default value if the key doesn't exist.
     * @return array|null
     */
    public function get_array(string $key, $default = null)
    {
        return $this->get($key, $default, Sanitizer::ARRAY);
    }

    /**
     * Convert the request to an array.
     *
     * @since 1.0.0
     *
     * @return array
     */
    public function to_array()
    {
        return $this->all();
    }
}
