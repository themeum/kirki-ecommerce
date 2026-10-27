<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Turns one transactional email on or off, or changes its subject or heading. The message body does not change.
 *
 * @since 1.0.0
 */
class UpdateEmailNotificationTool extends StoreWriteTool
{
    const RECIPIENTS = ['customer', 'admin'];

    const FIELDS = ['is_enabled', 'subject', 'heading'];

    /** @var array<string, mixed> */
    protected $meta = ['anthropic/requiresUserInteraction' => true];

    /** @var string */
    protected $description = 'Turn one transactional email on or off, or change its subject or heading, for example the customer "order_on_hold" email. '
        . 'The message body, the template and the other emails do not change. The order-lifecycle resource shows which action sends which email. '
        . 'Call without "confirmation_token" to get a preview and a token, then call again with the same arguments and the token.';

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function arguments(JsonSchema $schema)
    {
        return [
            'recipient' => $schema->string()->enum(static::RECIPIENTS)->description('Who gets the email.'),
            'group' => $schema->string()->description('Notification group, for example "order_notifications", "user_notifications" or "inventory_notifications".'),
            'key' => $schema->string()->description('Notification key, for example "order_shipped" or "new_order".'),
            'is_enabled' => $schema->boolean()->description('Send this email.'),
            'subject' => $schema->string()->description('Email subject, 1 to 200 characters.'),
            'heading' => $schema->string()->description('Email heading, 1 to 200 characters.'),
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function validate(array $arguments)
    {
        $params = $this->validate_arguments($arguments, [
            'recipient' => 'required|string|in:' . implode(',', static::RECIPIENTS),
            'group' => 'required|string|max:100',
            'key' => 'required|string|max:100',
            'is_enabled' => 'nullable|boolean',
            'subject' => 'nullable|string|min:1|max:200',
            'heading' => 'nullable|string|min:1|max:200',
        ], [
            'recipient.required' => $this->one_of_message('recipient', static::RECIPIENTS),
            'recipient.in' => $this->one_of_message('recipient', static::RECIPIENTS),
        ]);

        $notifications = $this->notifications();
        $id = $params['recipient'] . '/' . $params['group'] . '/' . $params['key'];

        if (!in_array($id, $notifications, true)) {
            /* translators: %s: comma separated notification IDs. */
            $this->reject(['key' => [sprintf(__('This notification does not exist. Send "recipient", "group" and "key" of one of: %s.', 'kirki-ecommerce'), implode(', ', $notifications))]]);
        }

        $fields = [];

        foreach (static::FIELDS as $field) {
            if (isset($params[$field])) {
                $fields[$field] = $field === 'is_enabled' ? filter_var($params[$field], FILTER_VALIDATE_BOOLEAN) : Sanitizer::apply_rule($params[$field], Sanitizer::TEXT);
            }
        }

        if (empty($fields)) {
            $message = __('Send at least one of "is_enabled", "subject" and "heading".', 'kirki-ecommerce');
            $this->reject(['is_enabled' => [$message], 'subject' => [$message], 'heading' => [$message]]);
        }

        return ['recipient' => $params['recipient'], 'group' => $params['group'], 'key' => $params['key'], 'fields' => $fields];
    }

    /**
     * Get the current values of the notification.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function target(array $params)
    {
        return (array) Settings::get(OptionKeys::EMAIL_SETTINGS)->get($this->path($params), []);
    }

    /**
     * Show the current and the new value of each field.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function preview(array &$params, $target)
    {
        $fields = [];

        foreach ($params['fields'] as $field => $value) {
            $fields[$field] = ['current' => $target[$field] ?? null, 'new' => $value];
        }

        return [
            'notification' => $params['recipient'] . '/' . $params['group'] . '/' . $params['key'],
            'fields' => $fields,
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function fingerprint(array $params, $target)
    {
        return $this->hash_values(array_intersect_key($target, array_flip(static::FIELDS)));
    }

    /**
     * Write the fields into the one notification and keep the rest of the email settings.
     *
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function apply(array $params, $target)
    {
        $settings = Settings::get(OptionKeys::EMAIL_SETTINGS);
        $top_key = $params['recipient'] . '_emails';
        $recipient_settings = (array) $settings->get($top_key, []);
        $recipient_settings[$params['group']][$params['key']] = array_merge((array) ($recipient_settings[$params['group']][$params['key']] ?? []), $params['fields']);

        $settings->set([$top_key => $recipient_settings]);

        $stored = (array) Settings::get(OptionKeys::EMAIL_SETTINGS)->get($this->path($params), []);

        return [
            'notification' => $params['recipient'] . '/' . $params['group'] . '/' . $params['key'],
            'is_enabled' => (bool) ($stored['is_enabled'] ?? false),
            'subject' => $stored['subject'] ?? null,
            'heading' => $stored['heading'] ?? null,
        ];
    }

    /**
     * Get the settings path of the notification.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $params Validated arguments.
     *
     * @return string
     */
    protected function path(array $params)
    {
        return $params['recipient'] . '_emails.' . $params['group'] . '.' . $params['key'];
    }

    /**
     * Get the IDs of the notifications in the default email settings, as recipient/group/key.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    protected function notifications()
    {
        $defaults = (array) Settings::get(OptionKeys::EMAIL_SETTINGS)->get_default();
        $ids = [];

        foreach (static::RECIPIENTS as $recipient) {
            foreach ((array) ($defaults[$recipient . '_emails'] ?? []) as $group => $notifications) {
                foreach ((array) $notifications as $key => $notification) {
                    if (is_array($notification) && array_key_exists('is_enabled', $notification)) {
                        $ids[] = $recipient . '/' . $group . '/' . $key;
                    }
                }
            }
        }

        return $ids;
    }
}
