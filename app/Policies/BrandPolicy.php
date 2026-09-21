<?php

namespace Kirki\Ecommerce\App\Policies;

use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\Framework\Wordpress\User;

/**
 * Authorization rules for brands; only administrators may manage them.
 *
 * @since 1.0.0
 */
class BrandPolicy
{
    /**
     * Determine whether the user can create brands.
     *
     * @since 1.0.0
     *
     * @param User $user The acting user.
     * @return bool
     */
    public function create(User $user)
    {
        return $user->is_admin();
    }

    /**
     * Determine whether the user can update the brand.
     *
     * @since 1.0.0
     *
     * @param User  $user  The acting user.
     * @param Brand $brand The brand being updated.
     * @return bool
     */
    public function update(User $user, Brand $brand)
    {
        return $user->is_admin();
    }
}
