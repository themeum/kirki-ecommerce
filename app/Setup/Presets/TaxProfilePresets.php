<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\App\Constants\Decision\Actions;
use Kirki\Ecommerce\App\Constants\Decision\Conditions;
use Kirki\Ecommerce\App\Models\TaxProfile;

defined('ABSPATH') || exit;

/**
 * Inserts the default "Standard" tax profile and the industry tax profiles.
 *
 * @since 1.0.0
 */
class TaxProfilePresets extends ProfilePresets
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function get_model_class()
    {
        return TaxProfile::class;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function get_section()
    {
        return 'tax_profiles';
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function get_condition_type()
    {
        return Conditions::TAX_PROFILE;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function get_allowed_actions()
    {
        return [Actions::SET_PRODUCT_TAX_RATE, Actions::SET_PRODUCT_TAX_EXEMPT];
    }
}
