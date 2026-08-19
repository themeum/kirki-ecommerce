<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

class UserService
{
    /**
     * Change a WordPress user's password after verifying their current password.
     *
     * wp_set_password() invalidates the user's auth cookie as a side effect,
     * so the session is re-issued afterward to keep the requesting browser logged in.
     *
     * @param int $user_id
     * @param string $current_password
     * @param string $new_password
     * @throws ValidationException
     * @return void
     */
    public function update_password(int $user_id, string $current_password, string $new_password)
    {
        $user = get_userdata($user_id);

        if (empty($user) || !wp_check_password($current_password, $user->user_pass, $user_id)) {
            throw ValidationException::with_errors([
                'current_password' => [__('Current password is incorrect.', 'kirki-ecommerce')],
            ]);
        }

        wp_set_password($new_password, $user_id);
        wp_set_auth_cookie($user_id);
    }

    /**
     * Update a WordPress user's display name.
     *
     * @param int $user_id
     * @param string $display_name
     * @throws ValidationException
     * @return void
     */
    public function update_display_name(int $user_id, string $display_name)
    {
        $result = wp_update_user([
            'ID' => $user_id,
            'display_name' => $display_name,
        ]);

        if (is_wp_error($result)) {
            throw ValidationException::with_errors([
                'display_name' => [$result->get_error_message()],
            ]);
        }
    }
}
