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
 */
class WebhookResult
{
    protected $success;
    protected $raw_body;
    protected $content_type;

    public function __construct(bool $success, ?string $raw_body = null, string $content_type = 'text/plain')
    {
        $this->success = $success;
        $this->raw_body = $raw_body;
        $this->content_type = $content_type;
    }

    public function success(): bool
    {
        return $this->success;
    }

    public function raw_body(): ?string
    {
        return $this->raw_body;
    }

    public function content_type(): string
    {
        return $this->content_type;
    }
}
