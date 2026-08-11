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

                    if (!empty($method['ranges'])) {
                        foreach ($method['ranges'] as $range_key => $range) {
                            $data['shipping_zones'][$key]['shipping_methods'][$method_key]['ranges'][$range_key]['base_amount'] = Money::prepare_amount_from_minor($range['base_amount']);
                            $data['shipping_zones'][$key]['shipping_methods'][$method_key]['ranges'][$range_key]['base_amount_money_object'] = Money::prepare_amount_object_from_minor($range['base_amount']);
                        }
                    } else {
                        $data['shipping_zones'][$key]['shipping_methods'][$method_key]['base_amount'] = Money::prepare_amount_from_minor($method['base_amount']);
                        $data['shipping_zones'][$key]['shipping_methods'][$method_key]['base_amount_money_object'] = Money::prepare_amount_object_from_minor($method['base_amount']);
                    }

                    if (!empty($method['is_free_shipping_enabled'])) {
                        $data['shipping_zones'][$key]['shipping_methods'][$method_key]['base_free_shipping_min_amount'] = Money::prepare_amount_from_minor($method['base_free_shipping_min_amount']);
                        $data['shipping_zones'][$key]['shipping_methods'][$method_key]['base_free_shipping_min_amount_money_object'] = Money::prepare_amount_object_from_minor($method['base_free_shipping_min_amount']);
                    }
                }
            }
        }

        return $data;
    }
}
