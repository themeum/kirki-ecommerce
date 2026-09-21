<?php

namespace Kirki\Ecommerce\App\Mails;

defined('ABSPATH') || exit;

use InvalidArgumentException;
use Kirki\Ecommerce\App\Contracts\Mailable;
use Kirki\Ecommerce\App\Parsers\ShortcodeParser;
use Kirki\Ecommerce\App\Supports\Facades\Settings;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\view;

/**
 * Base class for the plugin's notification emails: builds the subject, HTML body and headers from the email settings.
 *
 * @since 1.0.0
 */
abstract class Mailer implements Mailable
{
    /** @var array<string, mixed> */
    protected $default_template_settings_overrides = [];

    /** @var array<string, mixed> */
    protected $email_settings_overrides = [];

    /**
     * Create a new instance of the concrete mail.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Constructor arguments of the concrete mail.
     * @return static
     */
    public static function make(...$args)
    {
        return new static(...$args);
    }

    /**
     * Override the default template branding (e.g. unsaved draft settings).
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $overrides Values replacing the saved default template settings.
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
     * @since 1.0.0
     *
     * @param array<string, mixed> $overrides Values keyed by setting name, replacing the saved ones.
     * @return $this
     */
    public function with_email_settings_overrides(array $overrides)
    {
        $this->email_settings_overrides = $overrides;

        return $this;
    }

    /**
     * Get the default template settings with any overrides applied.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function get_default_template_settings()
    {
        return array_merge(Settings::get('email')->get('default_template') ?? [], $this->default_template_settings_overrides);
    }

    /**
     * Get a setting of this notification, preferring an override over the saved value.
     *
     * @since 1.0.0
     *
     * @param string $key     Setting name, such as `subject`, `heading` or `message`.
     * @param mixed  $default Value returned when the setting is not saved.
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
     * Get the dot-notation key of this notification within the email settings.
     *
     * @since 1.0.0
     *
     * @return string
     */
    abstract public function option_key();

    /**
     * Get the view name used to render the email body.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function template()
    {
        return 'emails.layouts.base';
    }

    /**
     * Get the email subject with shortcodes replaced by the mail variables.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public function subject()
    {
        $subject = $this->get_email_settings_value('subject');

        return ShortcodeParser::create()->with($this->get_variables())->parse($subject);
    }

    /**
     * Get the template variables specific to this notification.
     *
     * These are merged over the default variables in get_variables().
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    abstract public function with();

    /**
     * Determine whether this notification is enabled in the email settings.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    protected function is_enabled()
    {
        $settings = Settings::get('email');

        return $settings->get($this->option_key() . '.is_enabled') ?? false;
    }

    /**
     * Get all variables available to the email template and shortcodes.
     *
     * Combines heading, body, footer and store details with the notification's own variables.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
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
     * Render the email body HTML with shortcodes replaced by the mail variables.
     *
     * @since 1.0.0
     *
     * @return string
     */
    protected function body()
    {
        $default_template = $this->get_default_template_settings();

        $body = view($this->template(), array_merge(['default_template' => $default_template], $this->get_variables()))->layout(false)->__toString();

        return ShortcodeParser::create()->with($this->get_variables())->parse($body);
    }

    /**
     * Determine whether the email is sent as plain text instead of HTML.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    protected function is_plain_text()
    {
        return false;
    }

    /**
     * Get the headers sent with the email.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    protected function headers()
    {
        if ($this->is_plain_text()) {
            return ['Content-Type: text/plain; charset=UTF-8'];
        }

        return ['Content-Type: text/html; charset=UTF-8'];
    }

    /**
     * Get the file paths attached to the email.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    protected function attachments()
    {
        return [];
    }

    /**
     * Send the email to the given recipient using wp_mail().
     *
     * @since 1.0.0
     *
     * @param string $to Recipient email address.
     * @return bool Whether wp_mail() accepted the message.
     * @throws InvalidArgumentException When the recipient is empty or the resolved subject is empty.
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

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_preview_html()
    {
        return $this->body();
    }

    /**
     * Render a partial view with the default template settings and the given data.
     *
     * @since 1.0.0
     *
     * @param string               $template View name.
     * @param array<string, mixed> $data     Variables passed to the view.
     * @return string
     */
    protected function get_content(string $template, array $data = [])
    {
        $default_template = $this->get_default_template_settings();

        return view($template, array_merge(['default_template' => $default_template], $data))->layout(false)->__toString();
    }
}
