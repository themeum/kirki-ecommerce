<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class SettingResource extends Resource
{
    /**
     * Convert the setting resource to an array.
     *
     * @return array The setting data as an associative array.
     */
    public function to_array()
    {
        $data = $this->settings;

        if ($this->key === OptionKeys::GENERAL_SETTINGS) {
            $data['store_logo'] = MediaAttachment::make($this->settings['store_logo'] ?? null);
        }

        if ($this->key === OptionKeys::SHIPPING_SETTINGS) {
            foreach ($data['shipping_zones'] as $key => $zone) {
                foreach ($zone['shipping_methods'] as $method_key => $method) {
                    $data['shipping_zones'][$key]['shipping_methods'][$method_key]['amount'] = Money::from_minor($method['amount'])->getAmount()->toFloat();

                    if (!empty($method['ranges'])) {
                        foreach ($method['ranges'] as $range_key => $range) {
                            $data['shipping_zones'][$key]['shipping_methods'][$method_key]['ranges'][$range_key]['amount'] = Money::from_minor($range['amount'])->getAmount()->toFloat();
                        }
                    }

                    if (!empty($method['is_free_shipping_enabled'])) {
                        $data['shipping_zones'][$key]['shipping_methods'][$method_key]['free_shipping_min_amount'] = Money::from_minor($method['free_shipping_min_amount'])->getAmount()->toFloat();
                    }
                }
            }
        }

        return $data;
    }
}
