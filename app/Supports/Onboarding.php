<?php

namespace Kirki\Ecommerce\App\Supports;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

defined('ABSPATH') || exit;

/**
 * Reads and records whether the store has completed onboarding.
 *
 * @since 1.0.0
 */
class Onboarding
{
    const ACTIVATION_REDIRECT_TRANSIENT = 'kirki_ecommerce_activation_redirect';

    /**
     * Check whether the store has completed onboarding.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    public static function is_completed()
    {
        return !empty(Option::get(OptionKeys::ONBOARDING_COMPLETED_AT));
    }

    /**
     * Record that the store has completed onboarding.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public static function mark_completed()
    {
        Option::set(OptionKeys::ONBOARDING_COMPLETED_AT, time());
    }

    /**
     * Get the admin URL of the onboarding wizard.
     *
     * @since 1.0.0
     *
     * @return string
     */
    public static function get_url()
    {
        return admin_url('admin.php?page=' . Assets::ADMIN_PAGE . '#/onboarding');
    }
}
