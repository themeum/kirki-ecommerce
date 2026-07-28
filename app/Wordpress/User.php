<?php

namespace Kirki\Ecommerce\App\Wordpress;

use Kirki\Ecommerce\App\Constants\UserRoles;
use Kirki\Ecommerce\Framework\Wordpress\User as FrameworkUser;

class User extends FrameworkUser
{
    /**
     * Check if the current user is an admin.
     *
     * @return bool
     * @since 1.0.0
     */
    public function is_admin()
    {
        return $this->has_role(UserRoles::ADMIN);
    }

    /**
     * Check if the current user is a customer.
     *
     * @return bool
     * @since 1.0.0
     */
    public function is_customer()
    {
        return $this->has_role(UserRoles::CUSTOMER);
    }

    /**
     * Get the current user active role.
     *
     * @return string|null
     * @since 1.0.0
     */
    public function get_active_role()
    {
        if ($this->is_admin()) {
            return UserRoles::ADMIN;
        }

        if ($this->is_customer()) {
            return UserRoles::CUSTOMER;
        }

        return null;
    }
}
