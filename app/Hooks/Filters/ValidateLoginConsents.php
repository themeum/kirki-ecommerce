<?php

/**
 * Block an interactive sign-in when a mandatory consent was not accepted.
 *
 * @package Kirki\Ecommerce\App\Hooks\Filters
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Filters;

use Kirki\Ecommerce\App\Concerns\RendersLoginConsents;
use Kirki\Ecommerce\App\Constants\ConsentLocations;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use WP_Error;
use WP_User;

defined('ABSPATH') || exit;

class ValidateLoginConsents extends BaseHook
{
    use RendersLoginConsents;

    public function get_name(): string
    {
        return 'authenticate';
    }

    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    /**
     * Run after wp_authenticate_username_password, which sits at 20.
     *
     * At the default priority this would resolve before the credentials do,
     * so a wrong password combined with an unticked box would be reported as
     * a consent failure instead of a bad password.
     *
     * @return int
     */
    public function get_priority()
    {
        return 30;
    }

    public function get_args_count()
    {
        return 3;
    }

    public function handle(...$args)
    {
        $user = $args[0];

        // Let an existing credential error win.
        if (is_wp_error($user) || !($user instanceof WP_User)) {
            return $user;
        }

        // Only the wp-login.php form posts `log`. Without this guard the
        // filter also fires for REST application passwords, XML-RPC and
        // programmatic wp_signon() calls, locking those out.
        if (Superglobals::post('log') === null) {
            return $user;
        }

        if (empty($this->get_unaccepted_consent_ids(ConsentLocations::LOGIN))) {
            return $user;
        }

        return new WP_Error(
            'kecom_consent_required',
            '<strong>' . esc_html__('Error:', 'kirki-ecommerce') . '</strong> '
                . esc_html__('You must accept the required terms to sign in.', 'kirki-ecommerce')
        );
    }
}
