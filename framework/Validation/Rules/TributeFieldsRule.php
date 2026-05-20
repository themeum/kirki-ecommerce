<?php

namespace Kirki\Ecommerce\Validation\Rules;

use Kirki\Ecommerce\App\Constants\TributeNotificationType;

/**
 * Validates tribute fields based on campaign settings and notification preferences.
 *
 * @since 1.0.0
 */
class TributeFieldsRule extends BaseRule
{
    /**
     * Determine if the tribute fields are valid.
     *
     * @return bool
     */
    public function validate_rule()
    {
        $data = $this->data;

        // Check if tribute is enabled
        $is_tribute_enabled = ($data['dedicate_donation'] === 'on' ||
            ($data['tribute_requirement'] === 'required'));

        if (!$is_tribute_enabled) {
            return true;
        }

        // Check basic tribute fields
        $basic_fields = ['tribute_type', 'tribute_first_name', 'tribute_notification_recipient_name'];
        foreach ($basic_fields as $field) {
            if (empty($data[$field])) {
                return false;
            }
        }

        // Check notification type and validate accordingly
        $notification_type = $data['tribute_notification_type'] ?? null;

        // If no notification type specified, check if campaign has preference
        if (
            empty($notification_type) && isset($data['tribute_notification_preference']) &&
            $data['tribute_notification_preference'] !== 'donor-decide'
        ) {
            $notification_type_map = [
                'send-ecard' => TributeNotificationType::ECARD,
                'send-post-mail' => TributeNotificationType::POST_MAIL,
                'send-ecard-and-post-mail' => TributeNotificationType::BOTH
            ];
            $notification_type = $notification_type_map[$data['tribute_notification_preference']] ?? TributeNotificationType::ECARD;
        }

        // Validate ECard notification fields
        if ($notification_type === TributeNotificationType::ECARD || $notification_type === TributeNotificationType::BOTH) {
            if (
                empty($data['tribute_notification_recipient_email']) ||
                empty($data['tribute_notification_recipient_phone']) ||
                !filter_var($data['tribute_notification_recipient_email'], FILTER_VALIDATE_EMAIL)
            ) {
                return false;
            }
        }

        // Validate Post Mail notification fields
        if ($notification_type === TributeNotificationType::POST_MAIL || $notification_type === TributeNotificationType::BOTH) {
            $address = $data['tribute_notification_recipient_address'] ?? [];
            $address_fields = ['address', 'city', 'zip_code', 'country'];

            foreach ($address_fields as $field) {
                if (empty($address[$field])) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * Get the error message for invalid tribute fields.
     *
     * @return string
     */
    public function get_error_message()
    {
        return __('Please fill in all required tribute fields correctly.', 'kirki-ecommerce');
    }

    /**
     * Check if the rule should be ignored.
     *
     * @return bool
     */
    protected function ignore_rule_check()
    {
        return false;
    }
}
