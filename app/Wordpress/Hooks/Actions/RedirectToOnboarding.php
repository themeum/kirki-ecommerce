<?php

namespace Kirki\Ecommerce\App\Wordpress\Hooks\Actions;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\App\Supports\Onboarding;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

/**
 * Sends the merchant to the onboarding wizard once, right after the plugin is activated.
 *
 * @since 1.0.0
 */
class RedirectToOnboarding extends BaseHook
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name()
    {
        return WPHookNames::ADMIN_INIT;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type()
    {
        return HookTypes::ACTION;
    }

    /**
     * Redirect to the onboarding wizard when activation queued a redirect.
     *
     * Runs on the `admin_init` action. The queued redirect is consumed on the
     * first admin request either way, so it never fires twice.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments, unused.
     * @return void
     */
    public function handle(...$args)
    {
        if (!get_transient(Onboarding::ACTIVATION_REDIRECT_TRANSIENT)) {
            return;
        }

        delete_transient(Onboarding::ACTIVATION_REDIRECT_TRANSIENT);

        if (!$this->should_redirect()) {
            return;
        }

        wp_safe_redirect(Onboarding::get_url());
        exit;
    }

    /**
     * Determine whether the current admin request may be redirected to the wizard.
     *
     * @since 1.0.0
     *
     * @return bool
     */
    protected function should_redirect()
    {
        if (wp_doing_ajax() || is_network_admin()) {
            return false;
        }

        if (null !== Superglobals::query('activate-multi')) {
            return false;
        }

        if (!current_user_can('manage_options')) {
            return false;
        }

        return !Onboarding::is_completed();
    }
}
