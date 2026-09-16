<?php

/**
 * Render legal consents on the WordPress login form.
 *
 * @package Kirki\Ecommerce\App\Hooks\Actions
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Hooks\Actions;

use Kirki\Ecommerce\App\Constants\ConsentLocations;
use Kirki\Ecommerce\App\Concerns\RendersLoginConsents;
use Kirki\Ecommerce\Framework\Wordpress\BaseHook;
use Kirki\Ecommerce\Framework\Wordpress\Constants\HookTypes;

defined('ABSPATH') || exit;

class RenderLoginConsents extends BaseHook
{
    use RendersLoginConsents;

    public function get_name(): string
    {
        return 'login_form';
    }

    public function get_type(): string
    {
        return HookTypes::ACTION;
    }

    public function handle(...$args)
    {
        $this->render_consents(ConsentLocations::LOGIN);
    }
}
