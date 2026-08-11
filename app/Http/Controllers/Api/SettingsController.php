<?php

namespace Kirki\Ecommerce\App\Http\Controllers\Api;

use Kirki\Ecommerce\App\Resources\SettingResource;
use Kirki\Ecommerce\App\Http\Requests\Settings\SettingsUpdateRequest;
use Kirki\Ecommerce\App\Constants\OptionKeys;

use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Http\Request;

use function Kirki\Ecommerce\Framework\response;

class SettingsController
{
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
            'message' => __('Settings updated successfully.', 'kirki-ecommerce'),
        ]);
    }
}
