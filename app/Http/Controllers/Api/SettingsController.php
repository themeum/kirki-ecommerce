<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Resources\SettingResource;
use Kirki\Ecommerce\App\Http\Requests\Settings\SettingsUpdateRequest;
use Kirki\Ecommerce\App\Constants\OptionKeys;

use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\Framework\response;

/**
 * REST controller for reading and saving settings groups.
 *
 * @since 1.0.0
 */
class SettingsController
{
    /**
     * Return the settings stored under a settings key.
     *
     * The `key` parameter must be one of the known option keys.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The settings key with its current values.
     */
    public function get(Request $request)
    {
        $request->validate([
            'key' => 'required|string|in:' . implode(',', OptionKeys::get_constant_values()),
        ]);

        $settings = Settings::get($request->string('key'))->to_array();

        return response()->json([
            'data' => SettingResource::make([
                'key' => $request->string('key'),
                'settings' => $settings,
            ]),
            'message' => __('Settings retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }


    /**
     * Save the request `data` into the settings stored under a settings key.
     *
     * @since 1.0.0
     *
     * @param SettingsUpdateRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The settings key with its saved values.
     */
    public function update(SettingsUpdateRequest $request)
    {
        $key = $request->string('key');
        $clean_data = $request->all();
        $data = $clean_data['data'] ?? [];

        $settings = Settings::get($key);
        $settings->set($data);

        return response()->json([
            'data' => SettingResource::make([
                'key' => $key,
                'settings' => $settings->to_array(),
            ]),
            'message' => __('Settings saved', 'kirki-ecommerce'),
        ]);
    }
}
