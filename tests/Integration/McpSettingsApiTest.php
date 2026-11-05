<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\App\Supports\Facades\Settings;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers tasks 1.4 and 1.5: saving and reading the MCP settings.
 *
 * Spec: mcp-settings (MCP settings are stored as one settings section, Settings response describes the server).
 */
class McpSettingsApiTest extends RestTestCase
{
    /**
     * Reset the MCP settings to their defaults.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        Settings::get(OptionKeys::MCP_SETTINGS)->set(['enabled' => false, 'read_only' => false, 'groups' => [], 'abilities' => []], false);
    }

    /**
     * Send a save of the MCP settings.
     *
     * @param array<string, mixed> $data Settings values.
     *
     * @return mixed
     * @since 1.0.0
     */
    protected function save(array $data)
    {
        return $this->request('PUT', 'settings', [
            'key' => OptionKeys::MCP_SETTINGS,
            'data' => array_merge(['enabled' => true, 'read_only' => false, 'groups' => [], 'abilities' => []], $data),
        ]);
    }

    /**
     * Scenarios "Fresh install" and "Adapter missing": the GET response gives the defaults and the read-only values.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_get_returns_defaults_and_server_details(): void
    {
        $data = $this->assert_api_success($this->request('GET', 'settings/' . OptionKeys::MCP_SETTINGS))['data'];

        $this->assertFalse($data['enabled']);
        $this->assertFalse($data['read_only']);
        $this->assertSame([], $data['groups']);
        $this->assertSame([], $data['abilities']);
        $this->assertCount(6, $data['catalog']);
        $this->assertSame(42, count(array_merge(...array_column($data['catalog'], 'abilities'))));
        $this->assertSame(wp_get_current_user()->user_login, $data['user_login']);
        $this->assertStringContainsString('profile.php#application-passwords-section', $data['profile_url']);
        $this->assertIsBool($data['application_passwords_available']);
        $this->assertFalse($data['adapter_available']);
        $this->assertNull($data['server_url']);
    }

    /**
     * An empty group or ability map is sent as a JSON object, not a list.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_empty_maps_are_json_objects(): void
    {
        $response = $this->request('GET', 'settings/' . OptionKeys::MCP_SETTINGS);
        $json = wp_json_encode($response->get_data());

        $this->assertStringContainsString('"groups":{}', $json);
        $this->assertStringContainsString('"abilities":{}', $json);
    }

    /**
     * A valid save stores the values, and the read-only values in the payload are not stored.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_valid_save_persists_the_settings(): void
    {
        $response = $this->save([
            'read_only' => true,
            'groups' => ['orders' => false],
            'abilities' => ['kirki-ecommerce/cancel-order' => false],
            'catalog' => [],
            'server_url' => 'https://example.com',
        ]);
        $data = $this->assert_api_success($response)['data'];
        $stored = Option::get(OptionKeys::MCP_SETTINGS);

        $this->assertTrue($data['enabled']);
        $this->assertTrue($data['read_only']);
        $this->assertSame(['orders' => false], $data['groups']);
        $this->assertSame(['kirki-ecommerce/cancel-order' => false], $data['abilities']);
        $this->assertCount(6, $data['catalog']);
        $this->assertArrayNotHasKey('catalog', $stored);
        $this->assertArrayNotHasKey('server_url', $stored);
    }

    /**
     * Scenario "Unknown ability name is rejected".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_ability_name_is_rejected(): void
    {
        $this->assert_validation_error($this->save(['abilities' => ['kirki-ecommerce/not-a-tool' => true]]));

        $this->assertFalse(Settings::get(OptionKeys::MCP_SETTINGS . '.enabled', false));
    }

    /**
     * An unknown group id is rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_unknown_group_is_rejected(): void
    {
        $this->assert_validation_error($this->save(['groups' => ['advanced' => true]]));
    }

    /**
     * A value that is not a boolean is rejected.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_non_boolean_value_is_rejected(): void
    {
        $this->assert_validation_error($this->save(['abilities' => ['kirki-ecommerce/cancel-order' => 'maybe']]));
        $this->assert_validation_error($this->save(['enabled' => 'yes']));
    }
}
