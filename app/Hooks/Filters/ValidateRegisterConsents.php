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

/**
 * Adds a registration error when a mandatory signup consent was not accepted.
 *
 * @since 1.0.0
 */
class ValidateRegisterConsents extends BaseHook
{
    use RendersLoginConsents;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return WPHookNames::REGISTRATION_ERRORS;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type(): string
    {
        return HookTypes::FILTER;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_args_count()
    {
        return 3;
    }

    /**
     * Add an error to the registration errors when a mandatory consent is unticked.
     *
     * Responds to registration_errors.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments: the WP_Error so far, then the sanitized login and email.
     * @return WP_Error The incoming errors, with the consent error added when needed.
     */
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
