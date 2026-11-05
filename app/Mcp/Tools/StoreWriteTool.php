<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Tool;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\App\Mcp\Concerns\ReadsStoreValues;
use Kirki\Ecommerce\App\Mcp\Concerns\ValidatesArguments;
use Kirki\Ecommerce\App\Mcp\ConfirmationTokens;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Request as HttpRequest;
use Kirki\Ecommerce\Framework\Wordpress\Constants\Capabilities;
use Throwable;
use WP_REST_Request;

use function Kirki\Ecommerce\Framework\app;

/**
 * Base of the tools that change store data. Only store administrators can run them.
 *
 * A change that is not additive needs two calls. The first call returns a preview and a token, and changes nothing.
 * The second call sends the same arguments and the token, and does the change.
 *
 * @since 1.0.0
 */
abstract class StoreWriteTool extends Tool
{
    use ReadsStoreValues;
    use ValidatesArguments;

    const STORE_TEXT_LIMIT = 500;

    const TOKEN_ARGUMENT = 'confirmation_token';

    /** @var bool */
    protected $read_only = false;

    /** @var bool */
    protected $idempotent = false;

    /** @var bool */
    protected $destructive = true;

    /** @var bool */
    protected $open_world = false;

    /** @var bool */
    protected $requires_confirmation = true;

    /**
     * Allow only store administrators to run the tool.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function permission()
    {
        return current_user_can(Capabilities::MANAGE_OPTIONS);
    }

    /**
     * Get the tool arguments, plus the confirmation token when the change needs a preview.
     *
     * @since 1.0.0
     *
     * @param JsonSchema $schema Schema builder.
     *
     * @return array<string, mixed>
     */
    public function input_schema(JsonSchema $schema)
    {
        $arguments = $this->arguments($schema);

        if ($this->requires_confirmation()) {
            $arguments[static::TOKEN_ARGUMENT] = $schema->string()
                ->description('Leave empty to get a preview and a token. To do the change, send the token from the preview with the same other arguments. A token works one time, for 10 minutes.');
        }

        return $arguments;
    }

    /**
     * Preview the change, or do it when the request has a valid token.
     *
     * @since 1.0.0
     *
     * @param Request $request Tool arguments.
     *
     * @return Response
     * @throws ValidationException When an argument is not valid, or a store rule rejects the change.
     */
    public function handle(Request $request)
    {
        $arguments = $request->all();
        $token = trim((string) ($arguments[static::TOKEN_ARGUMENT] ?? ''));
        unset($arguments[static::TOKEN_ARGUMENT]);

        $params = $this->validate($arguments);
        $target = $this->target($params);

        if ($target instanceof Response) {
            return $target;
        }

        if (!$this->requires_confirmation()) {
            return $this->apply_as_assistant($params, $target);
        }

        if ($token === '') {
            return $this->preview_response($params, $target);
        }

        $tokens = $this->tokens();
        $preview_fingerprint = $tokens->claim($token, $this->name(), (int) get_current_user_id(), $params);

        if ($preview_fingerprint === null || !hash_equals($preview_fingerprint, $this->fingerprint($params, $target))) {
            return Response::error(__('The confirmation token is not valid: it expired, it was used, the arguments are not the same as in the preview, or the data changed after the preview. Call the tool again without "confirmation_token" to get a new preview.', 'kirki-ecommerce'));
        }

        return $this->apply_as_assistant($params, $target);
    }

    /**
     * Tell if the change needs a preview and a token.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function requires_confirmation()
    {
        return $this->requires_confirmation;
    }

    /**
     * Get the schema of the tool arguments, without the confirmation token.
     *
     * @since 1.0.0
     *
     * @param JsonSchema $schema Schema builder.
     *
     * @return array<string, mixed>
     */
    abstract protected function arguments(JsonSchema $schema);

    /**
     * Validate the arguments.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $arguments Arguments without the confirmation token.
     *
     * @return array<string, mixed> Validated arguments.
     * @throws ValidationException When an argument is not valid.
     */
    abstract protected function validate(array $arguments);

    /**
     * Find the record that the change targets.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return mixed The target, or an error response when it is not found.
     */
    abstract protected function target(array $params);

    /**
     * Describe the planned change, with the current and the new values. A store rule that rejects the change throws here.
     *
     * The tool can add values to the arguments, for example a generated code, that the confirmed call must send.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     * @param mixed                $target The target from target().
     *
     * @return array<string, mixed>|Response The changes, or a response that ends the call without a token.
     * @throws ValidationException When a store rule rejects the change.
     */
    protected function preview(array &$params, $target)
    {
        return [];
    }

    /**
     * Hash the data of the target that the change depends on.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     * @param mixed                $target The target from target().
     *
     * @return string
     */
    protected function fingerprint(array $params, $target)
    {
        return '';
    }

    /**
     * Do the change and get the stored values.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     * @param mixed                $target The target from target().
     *
     * @return array<string, mixed>|Response The stored values, or an error response.
     * @throws ValidationException When a store rule rejects the change.
     */
    abstract protected function apply(array $params, $target);

    /**
     * Hash a list of values for a fingerprint.
     *
     * @since 1.0.0
     *
     * @param mixed $values Values the change depends on.
     *
     * @return string
     */
    protected function hash_values($values)
    {
        return hash('sha256', (string) wp_json_encode($values));
    }

    /**
     * Validate and sanitize data with an admin request class, the same as the admin endpoint does.
     *
     * @since 1.0.0
     *
     * @param string               $request_class Request class, a subclass of the framework Request.
     * @param array<string, mixed> $data          Body data.
     * @param array<string, mixed> $route_params  Route parameters, such as the record ID.
     *
     * @return HttpRequest The validated request. Its all() gives the sanitized data.
     * @throws ValidationException When the data is not valid.
     */
    protected function form_request(string $request_class, array $data, array $route_params = [])
    {
        $rest_request = new WP_REST_Request('POST');
        $rest_request->set_body_params($data);
        $rest_request->set_url_params($route_params);

        return $request_class::from_wp_rest_request($rest_request)->authorize_request()->validate_request();
    }

    /**
     * Turn a decimal amount in the base currency into minor units.
     *
     * @since 1.0.0
     *
     * @param mixed  $amount   Decimal amount.
     * @param string $argument Argument name, for the error.
     *
     * @return int
     * @throws ValidationException When the amount is negative or has more decimals than the currency.
     */
    protected function to_minor($amount, string $argument)
    {
        $currency = Money::get_base_currency();

        try {
            $minor = Money::of((string) $amount, $currency)->getMinorAmount()->toInt();
        } catch (Throwable $exception) {
            $minor = -1;
        }

        if ($minor < 0) {
            /* translators: 1: argument name, 2: currency code. */
            $this->reject([$argument => [sprintf(__('The "%1$s" must be a decimal amount of 0 or more in %2$s, with no more decimals than the currency has.', 'kirki-ecommerce'), $argument, $currency)]]);
        }

        return $minor;
    }

    /**
     * Make the preview response with a new token.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     * @param mixed                $target The target from target().
     *
     * @return Response
     * @throws ValidationException When a store rule rejects the change.
     */
    protected function preview_response(array $params, $target)
    {
        $changes = $this->preview($params, $target);

        if ($changes instanceof Response) {
            return $changes;
        }

        $tokens = $this->tokens();
        $token = $tokens->issue($this->name(), (int) get_current_user_id(), $params, $this->fingerprint($params, $target));

        return Response::structured([
            'status' => 'preview',
            'changes' => $changes,
            'confirmation_token' => $token,
            'expires_at' => $this->datetime(gmdate('Y-m-d H:i:s', $tokens->expires_at())),
        ]);
    }

    /**
     * Do the change with order activities marked as made by the AI assistant.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     * @param mixed                $target The target from target().
     *
     * @return Response
     * @throws ValidationException When a store rule rejects the change.
     */
    protected function apply_as_assistant(array $params, $target)
    {
        $result = OrderActivity::as_assistant(function () use ($params, $target) {
            return $this->apply($params, $target);
        });

        if ($result instanceof Response) {
            return $result;
        }

        return Response::structured(['status' => 'done'] + $result);
    }

    /**
     * Get the token store.
     *
     * @since 1.0.0
     *
     * @return ConfirmationTokens
     */
    protected function tokens()
    {
        return app()->make(ConfirmationTokens::class);
    }
}
