<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Models\ShippingProfile;

defined('ABSPATH') || exit;

/**
 * Inserts the default "General" shipping profile and the industry shipping profiles.
 *
 * @since 1.0.0
 */
class ShippingProfilePresets extends ProfilePresets
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function get_model_class()
    {
        return ShippingProfile::class;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function get_section()
    {
        return 'shipping_profiles';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function get_condition_type()
    {
        return Conditions::SHIPPING_PROFILE;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function get_allowed_actions()
    {
        return [Actions::MULTIPLY_SHIPPING_COST, Actions::DISABLE_SHIPPING_METHOD];
    }
}
