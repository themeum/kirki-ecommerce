<?php

namespace Kirki\Ecommerce\App\Supports;

defined('ABSPATH') || exit;

/**
 * The catalog of preset shipping carriers.
 *
 * A zone starts with no carriers. The merchant adds a preset from the Add menu
 * of the zone page, and the client copies the preset into the zone.
 *
 * Preset logos in `assets/images/carriers/` are generic initials marks in each
 * carrier's brand colour, drawn for this plugin. They are not the carriers'
 * official logos, which need the carriers' permission to bundle.
 *
 * @since 1.0.0
 */
class ShippingCarrierPresets
{
    /**
     * Get the preset carriers, keyed by preset key.
     *
     * @since 1.0.0
     *
     * @return array<string, array{name: string, tracking_url: string}>
     */
    public static function catalog()
    {
        return [
            'ups' => [
                'name' => 'UPS',
                'tracking_url' => 'https://www.ups.com/track?loc=en_US&tracknum={tracking_number}',
            ],
            'fedex' => [
                'name' => 'FedEx',
                'tracking_url' => 'https://www.fedex.com/fedextrack/?trknbr={tracking_number}',
            ],
            'dhl' => [
                'name' => 'DHL',
                'tracking_url' => 'https://www.dhl.com/global-en/home/tracking/tracking-express.html?submit=1&tracking-id={tracking_number}',
            ],
            'usps' => [
                'name' => 'USPS',
                'tracking_url' => 'https://tools.usps.com/go/TrackConfirmAction?tLabels={tracking_number}',
            ],
            'royal-mail' => [
                'name' => 'Royal Mail',
                'tracking_url' => 'https://www.royalmail.com/track-your-item#/tracking-results/{tracking_number}',
            ],
            'canada-post' => [
                'name' => 'Canada Post',
                'tracking_url' => 'https://www.canadapost-postescanada.ca/track-reperage/en#/search?searchFor={tracking_number}',
            ],
            'australia-post' => [
                'name' => 'Australia Post',
                'tracking_url' => 'https://auspost.com.au/mypost/track/#/details/{tracking_number}',
            ],
            'dpd' => [
                'name' => 'DPD',
                'tracking_url' => 'https://tracking.dpd.de/status/en_US/parcel/{tracking_number}',
            ],
            'aramex' => [
                'name' => 'Aramex',
                'tracking_url' => 'https://www.aramex.com/track/results?ShipmentNumber={tracking_number}',
            ],
        ];
    }

    /**
     * List the preset carriers for the Add menu of a shipping zone.
     *
     * @since 1.0.0
     *
     * @return array<int, array{key: string, name: string, tracking_url: string, logo_url: string|null}>
     */
    public static function get_catalog_list()
    {
        $list = [];

        foreach (static::catalog() as $key => $preset) {
            $list[] = [
                'key' => $key,
                'name' => $preset['name'],
                'tracking_url' => $preset['tracking_url'],
                'logo_url' => static::get_logo_url(['preset' => $key]),
            ];
        }

        return $list;
    }

    /**
     * Resolve the logo URL of a carrier.
     *
     * A custom logo wins, then the logo bundled for the preset.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $carrier Stored carrier.
     * @return string|null
     */
    public static function get_logo_url(array $carrier)
    {
        if (!empty($carrier['logo'])) {
            $url = wp_get_attachment_url((int) $carrier['logo']);

            if (!empty($url)) {
                return $url;
            }
        }

        $preset = $carrier['preset'] ?? null;

        if (empty($preset) || !isset(static::catalog()[$preset])) {
            return null;
        }

        return Assets::get_url('images/carriers/' . $preset . '.svg');
    }

    /**
     * Add the derived `logo_url` to every carrier of a zone.
     *
     * A zone without a `shipping_carriers` key is returned as it is.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $zone Stored zone.
     * @return array<string, mixed>
     */
    public static function with_logo_urls(array $zone)
    {
        if (!isset($zone['shipping_carriers']) || !is_array($zone['shipping_carriers'])) {
            return $zone;
        }

        $zone['shipping_carriers'] = array_map(function ($carrier) {
            if (!is_array($carrier)) {
                return $carrier;
            }

            $carrier['logo_url'] = static::get_logo_url($carrier);

            return $carrier;
        }, $zone['shipping_carriers']);

        return $zone;
    }
}
