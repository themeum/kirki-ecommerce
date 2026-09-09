<?php

namespace Kirki\Ecommerce\App\Payment;

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
