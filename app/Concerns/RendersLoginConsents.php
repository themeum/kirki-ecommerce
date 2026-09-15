<?php

/**
 * Shared rendering and reading of consents on the wp-login.php forms.
 *
 * @package Kirki\Ecommerce\App\Concerns
 * @author Themeum <support@themeum.com>
 * @link https://themeum.com
 * @since 1.0.0
 */

namespace Kirki\Ecommerce\App\Concerns;

use Kirki\Ecommerce\App\Constants\ConsentMethods;
use Kirki\Ecommerce\App\Services\LegalConsentService;
use Kirki\Ecommerce\Framework\Http\Superglobals;
use Kirki\Ecommerce\Framework\Sanitizer;

use function Kirki\Ecommerce\Framework\app;

defined('ABSPATH') || exit;

trait RendersLoginConsents
{
    /**
     * The field the consent checkboxes are posted under.
     */
    protected static $consent_field = 'kecom_consents';

    /**
     * Render the consents configured for a location.
     *
     * Styles are inlined because wp_enqueue_scripts does not fire on
     * wp-login.php, so the storefront bundle is not present there.
     *
     * @param string $location
     *
     * @return void
     */
    protected function render_consents(string $location)
    {
        $consents = app(LegalConsentService::class)->get_renderable($location);

        if (empty($consents)) {
            return;
        }

        echo '<style>.kecom-login-consent{margin-bottom:16px;display:block;font-size:13px;line-height:1.5}.kecom-login-consent input{margin-right:6px}</style>';

        foreach ($consents as $consent) {
            if (!in_array($consent['method'], ConsentMethods::get_checkbox_methods(), true)) {
                echo '<p class="kecom-login-consent">' . wp_kses_post($consent['html']) . '</p>';

                continue;
            }

            printf(
                '<label class="kecom-login-consent"><input type="checkbox" name="%1$s[]" value="%2$s" /><span>%3$s</span></label>',
                esc_attr(static::$consent_field),
                esc_attr($consent['id']),
                wp_kses_post($consent['html'])
            );
        }
    }

    /**
     * Get the ids of the mandatory consents the request did not accept.
     *
     * @param string $location
     *
     * @return string[]
     */
    protected function get_unaccepted_consent_ids(string $location)
    {
        $accepted = Superglobals::post(static::$consent_field, [], Sanitizer::ARRAY);
        $accepted = is_array($accepted) ? array_map('strval', $accepted) : [];

        return array_values(
            array_diff(
                app(LegalConsentService::class)->get_mandatory_ids($location),
                $accepted
            )
        );
    }
}
