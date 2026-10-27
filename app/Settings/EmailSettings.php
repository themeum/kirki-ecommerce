<?php

namespace Kirki\Ecommerce\App\Settings;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\AppSettings;
use Kirki\Ecommerce\App\Constants\Email\AdminInventoryNotification;
use Kirki\Ecommerce\App\Constants\Email\AdminOrderNotification;
use Kirki\Ecommerce\App\Constants\Email\AdminUserNotification;
use Kirki\Ecommerce\App\Constants\Email\CustomerOrderNotification;
use Kirki\Ecommerce\App\Constants\Email\CustomerUserNotification;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

/**
 * Settings group for the store's email notification options.
 *
 * @since 1.0.0
 */
class EmailSettings extends AppSettings
{
    /**
     * The email settings are large and are read only when mail is sent or edited.
     *
     * @var bool
     */
    protected $autoload = false;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_option_key()
    {
        return OptionKeys::EMAIL_SETTINGS;
    }

    /**
     * Get email settings values.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed>
     */
    public function to_array()
    {
        $data = parent::to_array();

        $notification_classes = [
            AdminOrderNotification::class,
            AdminInventoryNotification::class,
            AdminUserNotification::class,
            CustomerOrderNotification::class,
            CustomerUserNotification::class,
        ];

        foreach ($notification_classes as $notification_class) {
            $type = $notification_class::get_type();
            $group = $notification_class::get_group();
            $options = $notification_class::get_constant_values();
            $stored_group = $data[$type][$group] ?? [];

            $data[$type][$group] = [];

            foreach ($options as $option) {
                $defaults = $this->get_default(sprintf('%s.%s.%s', $type, $group, $option)) ?? [];

                if (!isset($stored_group[$option])) {
                    $data[$type][$group][$option] = $defaults;
                    continue;
                }

                $data[$type][$group][$option] = [
                    'is_enabled' => $stored_group[$option]['is_enabled'] ?? false,
                    'subject' => $stored_group[$option]['subject'] ?? '',
                    'heading' => $stored_group[$option]['heading'] ?? '',
                    'message' => $stored_group[$option]['message'] ?? '',
                    'shortcodes' => $defaults['shortcodes'] ?? [],
                ];
            }
        }

        return $data;
    }

    /**
     * Restore one notification template to its bundled default values.
     *
     * @since 1.0.0
     *
     * @param string $root  Settings root key, such as admin_emails.
     * @param string $group Notification group key, such as order_notifications.
     * @param string $key   Notification key within the group, such as new_order.
     * @return array<string, mixed>|null The restored template, or null when no default exists.
     */
    public function restore_default_notification(string $root, string $group, string $key)
    {
        $default = $this->get_default(sprintf('%s.%s.%s', $root, $group, $key));

        if (!is_array($default)) {
            return null;
        }

        $shortcodes = $default['shortcodes'] ?? [];
        unset($default['shortcodes']);

        $stored = Option::get($this->get_option_key()) ?? [];
        $stored_root = $stored[$root] ?? $this->get_default($root) ?? [];
        $stored_root[$group][$key] = $default;

        $this->set([$root => $stored_root]);

        return array_merge($default, ['shortcodes' => $shortcodes]);
    }
}
