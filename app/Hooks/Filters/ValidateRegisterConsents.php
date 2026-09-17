<?php

/**
 * Block registration when a mandatory consent was not accepted.
 *
 * @package Kirki\Ecommerce\App\Hooks\Filters
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Filters;

use Kirki\Ecommerce\App\Concerns\RendersLoginConsents;
use Kirki\Ecommerce\App\Constants\ConsentLocations;
use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;
use WP_Error;

defined('ABSPATH') || exit;

class ValidateRegisterConsents extends BaseHook
{
    use RendersLoginConsents;

    public function get_name(): string
    {
        return WPHookNames::REGISTRATION_ERRORS;
    }

    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    public function get_args_count()
    {
        return 3;
    }

    public function handle(...$args)
    {
        $errors = $args[0];

        if (!($errors instanceof WP_Error)) {
            return $errors;
        }

        if (empty($this->get_unaccepted_consent_ids(ConsentLocations::SIGNUP))) {
            return $errors;
        }

        $errors->add(
            'kecom_consent_required',
            '<strong>' . esc_html__('Error:', 'kirki-ecommerce') . '</strong> '
                . esc_html__('You must accept the required terms to register.', 'kirki-ecommerce')
        );

        return $errors;
    }
}
