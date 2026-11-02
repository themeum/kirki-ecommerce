<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Concerns;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Mails\Mailer;
use Kirki\Ecommerce\App\Supports\Utils;
use WP_User;

/**
 * Decides whether the store's email replaces a WordPress core email to a user.
 *
 * The store takes over only for customers (users who cannot manage the site),
 * only while the matching template is enabled, and only on WordPress versions
 * that let the core email be stopped. Otherwise WordPress keeps sending its own.
 *
 * @since 1.0.0
 */
trait TakesOverCoreUserEmails
{
    /**
     * Determine whether the store's email replaces the core one for this user.
     *
     * @since 1.0.0
     *
     * @param WP_User|null $user           The user the email is for.
     * @param string       $option_key     Dot-notation key of the store's notification in the email settings.
     * @param string       $min_wp_version Oldest WordPress version that can stop the core email.
     * @return bool
     */
    protected function takes_over_core_email($user, string $option_key, string $min_wp_version)
    {
        if (!$user instanceof WP_User || empty($user->ID) || user_can($user, 'manage_options')) {
            return false;
        }

        return Utils::wp_version_at_least($min_wp_version) && Mailer::is_enabled_key($option_key);
    }
}
