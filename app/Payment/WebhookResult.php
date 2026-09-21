<?php

namespace Kirki\Ecommerce\App\Payment;

/**
 * The outcome of a payment provider's webhook() handling.
 *
 * Most providers can report success/failure with a plain bool and let
 * WebhookController wrap it in the standard JSON response. A provider whose
 * platform requires a specific raw response body (e.g. 2Checkout's classic
 * IPN read-receipt XML) returns this instead, and WebhookController emits
 * raw_body()/content_type() as the response body in place of the JSON
 * envelope.
 *
 * @since 1.0.0
 */
class WebhookResult
{
    /** @var bool */
    protected $success;
    /** @var string|null */
    protected $raw_body;
    /** @var string */
    protected $content_type;

    /**
     * Create a webhook result.
     *
     * @since 1.0.0
     *
     * @param bool        $success      Whether the webhook was handled successfully.
     * @param string|null $raw_body     Raw response body to emit instead of the JSON envelope.
     * @param string      $content_type MIME type of the raw response body.
     */
    public function __construct(bool $success, ?string $raw_body = null, string $content_type = 'text/plain')
    {
        $this->success = $success;
        $this->raw_body = $raw_body;
        $this->content_type = $content_type;
    }

    /**
     * Check whether the webhook was handled successfully.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public function success(): bool
    {
        return $this->success;
    }

    /**
     * Get the raw response body to emit, if the provider requires one.
     *
     * @since 1.0.0
     *
     * @return string|null
     */
    public function raw_body(): ?string
    {
        return $this->raw_body;
    }

    /**
     * Get the MIME type of the raw response body.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function content_type(): string
    {
        return $this->content_type;
    }
}
