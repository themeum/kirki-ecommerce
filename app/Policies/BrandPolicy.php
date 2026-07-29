<?php

namespace Kirki\Ecommerce\App\Policies;

use Kirki\Ecommerce\App\Models\Brand;
use Kirki\Ecommerce\Framework\Wordpress\User;

class BrandPolicy
{
    public function create(User $user)
    {
        return $user->is_admin();
    }

    public function update(User $user, Brand $brand)
    {
        return $user->is_admin();
    }
}
