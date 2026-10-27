<?php

namespace Kirki\Ecommerce\App\Mcp\Concerns;

defined('ABSPATH') || exit;

/**
 * Masks the personal data that list tools return.
 *
 * @since 1.0.0
 */
trait MasksPersonalData
{
    /**
     * Mask an email: the first character of the local part, then ***, then @ and the full domain.
     *
     * @since 1.0.0
     *
     * @param string|null $email Email to mask.
     *
     * @return string|null Null when there is no email, *** when the value has no @.
     */
    protected function mask_email($email)
    {
        $email = trim((string) $email);

        if ($email === '') {
            return null;
        }

        $at = strrpos($email, '@');

        if ($at === false || $at === 0) {
            return '***';
        }

        return mb_substr($email, 0, 1) . '***' . substr($email, $at);
    }

    /**
     * Get the first name only. A full name is not split.
     *
     * @since 1.0.0
     *
     * @param string|null $first_name First name field.
     *
     * @return string|null Null when there is no first name.
     */
    protected function first_name($first_name)
    {
        $first_name = trim((string) $first_name);

        return $first_name === '' ? null : $first_name;
    }
}
