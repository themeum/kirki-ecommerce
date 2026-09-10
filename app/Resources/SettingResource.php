<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Constants\PageKeys;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\App\Facades\Money;
use Kirki\Ecommerce\App\Models\Page;
use Kirki\Ecommerce\App\Supports\Utils;
use Kirki\Ecommerce\Framework\Contracts\SomoyInterface;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;
use Kirki\Ecommerce\Framework\Supports\Somoy;

use function Kirki\Ecommerce\Framework\collection;
use function Kirki\Ecommerce\Framework\dd;

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

        switch ($this->key) {
            case OptionKeys::GENERAL_SETTINGS:
                $data['store_logo'] = MediaAttachment::make($this->settings['store_logo'] ?? null);
                break;
            case OptionKeys::SHIPPING_SETTINGS:
                $data = $this->get_shipping_settings($data);
                break;
            case OptionKeys::ADVANCE_SETTINGS:
                $data = $this->get_advanced_settings($data);
                break;
            case OptionKeys::CURRENCY_SETTINGS:
                $data = $this->get_currency_settings($data);
            default:
                break;
        }

        return $data;
    }

    /**
     * Get the shipping settings.
     * 
     * @param array $data
     * 
     * @return array
     */
    protected function get_advanced_settings($data)
    {
        $page_ids = collection($data['pages'] ?? [])->map(function ($page_id) {
            return (int) $page_id;
        })->values()->to_array();

        $pages = Page::query()->where_in('ID', $page_ids)->get();

        $formatted_pages = [];

        foreach (PageKeys::get_list() as $page_key => $name) {
            $page_id = $data['pages'][$page_key] ?? null;
            $page = $pages->find(function ($page) use ($page_id) {
                return (int) $page->ID === (int) $page_id;
            });

            if (empty($page)) {
                $formatted_pages[] = [
                    'id' => null,
                    'key' => $page_key,
                    'name' => $name,
                    'title' => '--',
                    'slug' => null,
                    'url' => null,
                    'status' => 'not-found'
                ];

                continue;
            }

            $formatted_pages[] = [
                'id' => $page->ID,
                'key' => $page_key,
                'name' => $name,
                'title' => $page->post_title,
                'slug' => $page->post_name,
                'url' => Utils::get_page_url_by_key($page_key),
                'status' => $page->post_status === 'publish' ? 'active' : 'inactive'
            ];
        }

        $data['pages'] = $formatted_pages;

        return $data;
    }

    /**
     * Get the shipping settings.
     * 
     * @param array $data
     * 
     * @return array
     */
    protected function get_shipping_settings($data)
    {
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

        return $data;
    }

    /**
     * Get the currency settings.
     * 
     * @param array $data
     * 
     * @return array
     */
    protected function get_currency_settings($data)
    {
        $reset_at = $data['usage']['reset_at'] ?? null;

        if (!empty($reset_at) && is_object($reset_at)) {
            $properties = get_object_vars($reset_at);

            if (
                isset($properties['__PHP_Incomplete_Class_Name']) &&
                $properties['__PHP_Incomplete_Class_Name'] === Somoy::class
            ) {
                $reset_at = Date::parse(
                    $properties['date'],
                    $properties['timezone']
                )->to_date_time_string();
            } else {
                $reset_at = null;
            }
        }

        return [
            'currency_format' => $data['currency_format'] ?? null,
            'currency_position' => $data['currency_position'] ?? null,
            'thousand_separator' => $data['thousand_separator'] ?? null,
            'decimal_separator' => $data['decimal_separator'] ?? null,
            'is_automatic_update_enabled' => $data['is_automatic_update_enabled'] ?? false,
            'api_provider' => $data['api_provider'] ?? null,
            'last_sync_at' => $data['last_sync_at'] ?? null,
            'next_sync_at' => $data['next_sync_at'] ?? null,
            'api_config' => !empty($data['api_config']) ? [
                'api_key' => $data['api_config']['api_key'] ?? null,
                'update_frequency' => $data['api_config']['update_frequency'] ?? null,
                'fallback_behaviour' => $data['api_config']['fallback_behaviour'] ?? null,
                'is_cache_enabled' => $data['api_config']['is_cache_enabled'] ?? false
            ] : null,
            'base_currency' => $data['base_currency'] ?? null,
            'usage' => !empty($data['usage']) ? [
                'total' => $data['usage']['total'] ?? null,
                'used' => $data['usage']['used'] ?? null,
                'remaining' => $data['usage']['remaining'] ?? null,
                'reset_at' => $reset_at
            ] : null
        ];
    }
}
