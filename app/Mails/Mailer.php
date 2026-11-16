<?php

namespace Kirki\Ecommerce\App\Mails;

defined('ABSPATH') || exit;

use DateTimeInterface;
use InvalidArgumentException;
use Kirki\Ecommerce\App\Constants\DateTimeFormats;
use Kirki\Ecommerce\App\Contracts\Mailable;
use Kirki\Ecommerce\App\Parsers\ShortcodeParser;
use Kirki\Ecommerce\App\Supports\CountryData;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Arr;
use Kirki\Ecommerce\Framework\View\View;

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

    /** @var string[] */
    protected $reserved_variables = ['header', 'body', 'footer', 'heading', 'additional_description', 'subject'];

    /** @var array<string, mixed> */
    protected $variables;

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
     * The stored `logo` is an attachment id, so its url is resolved into `logo_url` for the views.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function get_default_template_settings()
    {
        $default_template = array_merge(Settings::get('email')->get('default_template') ?? [], $this->default_template_settings_overrides);
        $logo_id = (int) ($default_template['logo'] ?? 0);

        $default_template['logo_url'] = $logo_id ? (wp_get_attachment_url($logo_id) ?: '') : '';

        return $default_template;
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

        $parsed = ShortcodeParser::create()->with($this->get_shortcode_variables())->parse($subject);

        return wp_specialchars_decode($parsed, ENT_QUOTES);
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
    public function is_enabled()
    {
        return static::is_enabled_key($this->option_key());
    }

    /**
     * Determine whether the notification at the given settings key is enabled.
     *
     * For callers that must decide before a mail can be constructed, such as
     * WordPress hooks choosing whether to replace a core email.
     *
     * @since 1.0.0
     *
     * @param string $option_key Dot-notation key of the notification within the email settings.
     * @return bool
     */
    public static function is_enabled_key(string $option_key)
    {
        return (bool) (Settings::get('email')->get($option_key . '.is_enabled') ?? false);
    }

    /**
     * Build the escaped default and notification variables.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function prepare_variables()
    {
        $general_settings = Settings::get('general');
        $email_settings = Settings::get('email');
        $country_code = $general_settings->get('store_address.country');
        $state_id = $general_settings->get('store_address.state');

        $default_variables = [
            'heading' => $this->get_email_settings_value('heading'),
            'body' => $this->get_email_settings_value('message'),
            'additional_description' => $email_settings->get('default_template.additional_description') ?? '',
            'footer' => $email_settings->get('default_template.footer') ?? '',
            'site_title' => get_bloginfo('name'),
            'store_name' => $general_settings->get('store_name'),
            'store_email' => $general_settings->get('store_email'),
            'store_phone' => $general_settings->get('store_phone'),
            'store_address' => collection([
                $general_settings->get('store_address.address_line_1'),
                $general_settings->get('store_address.address_line_2'),
                $general_settings->get('store_address.city'),
                CountryData::get_state_name((string) $country_code, $state_id) ?? $state_id,
                CountryData::get_country_name((string) $country_code) ?? $country_code,
                $general_settings->get('store_address.postal_code'),
            ])->filter(fn($value) => !empty($value))->join(', '),
        ];

        return $this->esc_template_data(array_merge($default_variables, $this->with()));
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
        return $this->variables ??= $this->prepare_variables();
    }

    /**
     * Get the scalar variables the shortcode parser may replace, without the reserved variables.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    protected function get_shortcode_variables()
    {
        return Arr::where(
            $this->get_variables(),
            fn($value, $key) => (is_scalar($value) && !in_array($key, $this->reserved_variables, true))
        );
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

        return ShortcodeParser::create()->with($this->get_shortcode_variables())->parse($body);
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

        $subject = $this->subject();

        if (empty($subject)) {
            throw new InvalidArgumentException(esc_html__('Email subject is required.', 'kirki-ecommerce'));
        }

        return wp_mail($to, $subject, $this->body(), $this->headers(), $this->attachments());
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
     * @return View
     */
    protected function get_content(string $template, array $data = [])
    {
        $default_template = $this->get_default_template_settings();

        return view($template, array_merge(['default_template' => $default_template], $data))->layout(false);
    }

    /**
     * Escape template variables for HTML output.
     *
     * Rendered views become strings, URLs use esc_url() and other scalars use esc_html().
     * Reserved variables keep their raw value.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $data Template variables.
     * @return array<string, mixed>
     */
    protected function esc_template_data(array $data)
    {
        foreach ($data as $key => $value) {
            if (in_array($key, $this->reserved_variables, true)) {
                continue;
            }

            if (is_null($value)) {
                $data[$key] = '';
                continue;
            }

            if ($value instanceof DateTimeInterface) {
                $data[$key] = $value->format(DateTimeFormats::HUMAN_READABLE_FULL_DATE);
                continue;
            }

            if ($value instanceof View) {
                $data[$key] = $value->__toString();
                continue;
            }

            if (is_scalar($value)) {
                $data[$key] = filter_var($value, FILTER_VALIDATE_URL) !== false ? esc_url($value) : esc_html($value);
            }
        }

        return $data;
    }
}
