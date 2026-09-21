<?php

namespace Kirki\Ecommerce\App\Mails;

defined('ABSPATH') || exit;

use InvalidArgumentException;
use Kirki\Ecommerce\App\Contracts\Mailable;
use Kirki\Ecommerce\App\Parsers\ShortcodeParser;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\view;

abstract class Mailer implements Mailable
{
    /**
     * @var array
     */
    protected $default_template_settings_overrides = [];

    /**
     * @var array
     */
    protected $email_settings_overrides = [];

    /**
     * @param mixed $args
     * @return static
     */
    public static function make(...$args)
    {
        return new static(...$args);
    }

    /**
     * Override the default template branding (e.g. unsaved draft settings).
     *
     * @param array $overrides
     * @return $this
     */
    public function with_default_template_settings_overrides(array $overrides)
    {
        $this->default_template_settings_overrides = $overrides;

        return $this;
    }

    /**
     * Override this notification's content (e.g. unsaved draft subject/heading/message).
     *
     * @param array $overrides
     * @return $this
     */
    public function with_email_settings_overrides(array $overrides)
    {
        $this->email_settings_overrides = $overrides;

        return $this;
    }

    /**
     * @return array
     */
    protected function get_default_template_settings()
    {
        return array_merge(Settings::get('email')->get('default_template') ?? [], $this->default_template_settings_overrides);
    }

    /**
     * @param string $key
     * @param mixed  $default
     * @return mixed
     */
    protected function get_email_settings_value(string $key, $default = '')
    {
        if (array_key_exists($key, $this->email_settings_overrides)) {
            return $this->email_settings_overrides[$key];
        }

        return Settings::get('email')->get($this->option_key() . '.' . $key) ?? $default;
    }

    /**
     * @return string
     */
    abstract public function option_key();

    /**
     * @return string
     */
    protected function template()
    {
        return 'emails.layouts.base';
    }

    /**
     * @return string
     */
    public function subject()
    {
        $subject = $this->get_email_settings_value('subject');

        return ShortcodeParser::create()->with($this->get_variables())->parse($subject);
    }

    /**
     * return email data
     * @return array
     */
    abstract public function with();

    /**
     * @return bool
     */
    protected function is_enabled()
    {
        $settings = Settings::get('email');

        return $settings->get($this->option_key() . '.is_enabled') ?? false;
    }

    /**
     * @return array
     */
    public function get_variables()
    {
        $general_settings = Settings::get('general');

        $settings = Settings::get('email');
        $heading = $this->get_email_settings_value('heading');
        $body = $this->get_email_settings_value('message');

        $default_variables = [
            'heading' => $heading,
            'body' => $body,
            'additional_description' => $settings->get('default_template.additional_description') ?? '',
            'footer' => $settings->get('default_template.footer') ?? '',
            'store_name' => $general_settings->get('store_name'),
            'store_email' => $general_settings->get('store_email'),
            'store_phone' => $general_settings->get('store_phone'),
            'store_address' => collection([
                'address_line_1' => $general_settings->get('store_address.address_line_1'),
                'address_line_2' => $general_settings->get('store_address.address_line_2'),
                'city' => $general_settings->get('store_address.city'),
                'state' => $general_settings->get('store_address.state'),
                'country' => $general_settings->get('store_address.country'),
                'postal_code' => $general_settings->get('store_address.postal_code'),
            ])->filter(fn($value) => !empty($value))->join(', '),
        ];

        return array_merge($default_variables, $this->with());
    }

    /**
     * return email body string
     * @return string
     */
    protected function body()
    {
        $default_template = $this->get_default_template_settings();

        $body = view($this->template(), array_merge(['default_template' => $default_template], $this->get_variables()))->layout(false)->__toString();

        return ShortcodeParser::create()->with($this->get_variables())->parse($body);
    }

    /**
     * @return bool
     */
    protected function is_plain_text()
    {
        return false;
    }

    /**
     * @return array
     */
    protected function headers()
    {
        if ($this->is_plain_text()) {
            return ['Content-Type: text/plain; charset=UTF-8'];
        }

        return ['Content-Type: text/html; charset=UTF-8'];
    }

    /**
     * @return array
     */
    protected function attachments()
    {
        return [];
    }

    /**
     * @return bool
     */
    public function send(string $to)
    {
        if (empty($to)) {
            throw new InvalidArgumentException(esc_html__('The recipient email address is empty.', 'kirki-ecommerce'));
        }

        if (empty($this->subject())) {
            throw new InvalidArgumentException(esc_html__('Email subject is required.', 'kirki-ecommerce'));
        }

        return wp_mail($to, $this->subject(), $this->body(), $this->headers(), $this->attachments());
    }

    public function get_preview_html()
    {
        return $this->body();
    }

    protected function get_content(string $template, array $data = [])
    {
        $default_template = $this->get_default_template_settings();

        return view($template, array_merge(['default_template' => $default_template], $data))->layout(false)->__toString();
    }
}
