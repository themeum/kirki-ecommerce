<?php

namespace Kirki\Ecommerce\Validation\Rules;

/**
 * Validates that an email is unique in the WordPress users table.
 * Supports excluding current user during updates.
 *
 * @since 1.0.0
 */
class EmailUniqueRule extends BaseRule
{
    /**
     * The user ID to exclude from uniqueness check (for updates).
     *
     * @var int|null
     */
    protected $exclude_user_id;

    /**
     * Set the user ID to exclude from uniqueness check.
     *
     * @param int $user_id
     * @return $this
     */
    public function exclude_user($user_id)
    {
        $this->exclude_user_id = $user_id;
        return $this;
    }

    /**
     * Determine if the email is unique in the users table.
     *
     * @return bool
     */
    public function validate_rule()
    {
        if (empty($this->value)) {
            return true;
        }

        $user = get_user_by('email', $this->value);

        if ($user === false) {
            return true;
        }

        if ($this->exclude_user_id && $user->ID === (int) $this->exclude_user_id) {
            return true;
        }

        return false;
    }

    /**
     * Get the error message for a non-unique email.
     *
     * @return string
     */
    public function get_error_message()
    {
        return sprintf(__('The email address %s is already in use.', 'kirki-ecommerce'), $this->value);
    }
}
