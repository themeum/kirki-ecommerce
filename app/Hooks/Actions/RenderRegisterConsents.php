<?php

/**
 * Render legal consents on the WordPress registration form.
 *
 * @package Kirki\Ecommerce\App\Hooks\Actions
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Actions;

use Kirki\Ecommerce\App\Constants\ConsentLocations;
use Kirki\Ecommerce\App\Concerns\RendersLoginConsents;
use Kirki\Ecommerce\App\Constants\Hooks\WPHookNames;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

defined('ABSPATH') || exit;

/**
 * Renders the signup-location legal consents on the wp-login.php registration form.
 *
 * @since 1.0.0
 */
class RenderRegisterConsents extends BaseHook
{
    use RendersLoginConsents;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_name(): string
    {
        return WPHookNames::REGISTER_FORM;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    /**
     * Echo the consents configured for the signup location. Responds to register_form.
     *
     * @since 1.0.0
     *
     * @param mixed ...$args Hook arguments, unused.
     * @return void
     */
    public function handle(...$args)
    {
        $this->render_consents(ConsentLocations::SIGNUP);
    }
}
