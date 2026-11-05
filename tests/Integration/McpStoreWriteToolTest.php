<?php

namespace Kirki\Ecommerce\Tests\Integration;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Mcp\ConfirmationTokens;
use Kirki\Ecommerce\App\Mcp\Tools\StoreWriteTool;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Tests\Support\RestTestCase;

/**
 * Covers task 1.5: the preview and confirmation flow that every write tool shares.
 *
 * Spec: mcp-write-tool-conventions (A change needs a preview and a confirmation token, Additive tools run in one call,
 * Only administrators can run a write tool, A done change returns the stored values).
 */
class McpStoreWriteToolTest extends RestTestCase
{
    const OPTION = 'kirki_ecommerce_test_write_value';

    /**
     * Start every test with the test value "old" and an administrator.
     *
     * @return void
     * @since 1.0.0
     */
    protected function setUp(): void
    {
        parent::setUp();
        update_option(static::OPTION, 'old');
        wp_set_current_user(static::factory()->user->create(['role' => 'administrator']));
    }

    /**
     * Get a write tool that changes the test value.
     *
     * @param bool $requires_confirmation Whether the change needs a preview.
     *
     * @return StoreWriteTool
     * @since 1.0.0
     */
    protected function tool(bool $requires_confirmation = true)
    {
        $tool = new class () extends StoreWriteTool {
            protected $name = 'kirki-ecommerce-test-write';

            public function set_requires_confirmation(bool $value)
            {
                $this->requires_confirmation = $value;
            }

            protected function arguments(JsonSchema $schema)
            {
                return ['value' => $schema->string()];
            }

            protected function validate(array $arguments)
            {
                return $this->validate_arguments($arguments, ['value' => 'required|string|max:20']);
            }

            protected function target(array $params)
            {
                return McpStoreWriteToolTest::OPTION;
            }

            protected function preview(array &$params, $target)
            {
                return ['value' => ['current' => get_option($target), 'new' => $params['value']]];
            }

            protected function fingerprint(array $params, $target)
            {
                return $this->hash_values([get_option($target)]);
            }

            protected function apply(array $params, $target)
            {
                update_option($target, $params['value']);

                return ['value' => get_option($target)];
            }
        };

        $tool->set_requires_confirmation($requires_confirmation);

        return $tool;
    }

    /**
     * Run the tool.
     *
     * @param array               $arguments Tool arguments.
     * @param StoreWriteTool|null $tool      Tool to run. A new tool when null.
     *
     * @return Response
     * @since 1.0.0
     */
    protected function run_tool(array $arguments, $tool = null)
    {
        return ($tool ?: $this->tool())->handle(new Request($arguments));
    }

    /**
     * Get a preview and its token for a new value.
     *
     * @param string $value New value.
     *
     * @return array
     * @since 1.0.0
     */
    protected function preview(string $value = 'new'): array
    {
        $response = $this->run_tool(['value' => $value]);

        $this->assertSame('structured', $response->kind());

        return $response->content();
    }

    /**
     * Assert that a response is the error that asks for a new preview.
     *
     * @param Response $response Tool response.
     *
     * @return void
     * @since 1.0.0
     */
    protected function assertAsksForNewPreview(Response $response): void
    {
        $this->assertTrue($response->is_error());
        $this->assertStringContainsString('without "confirmation_token"', $response->content());
    }

    /**
     * Scenario "Preview changes nothing".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_preview_changes_nothing(): void
    {
        $preview = $this->preview();

        $this->assertSame('preview', $preview['status']);
        $this->assertSame(['value' => ['current' => 'old', 'new' => 'new']], $preview['changes']);
        $this->assertSame(32, strlen($preview['confirmation_token']));
        $this->assertNotEmpty($preview['expires_at']);
        $this->assertSame('old', get_option(static::OPTION));
    }

    /**
     * Scenario "Confirmed change": the stored value is returned.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_confirmed_change(): void
    {
        $preview = $this->preview();

        $done = $this->run_tool(['value' => 'new', 'confirmation_token' => $preview['confirmation_token']])->content();

        $this->assertSame(['status' => 'done', 'value' => 'new'], $done);
        $this->assertSame('new', get_option(static::OPTION));
    }

    /**
     * Scenario "Arguments differ from the preview".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_other_arguments(): void
    {
        $preview = $this->preview('new');

        $this->assertAsksForNewPreview($this->run_tool(['value' => 'other', 'confirmation_token' => $preview['confirmation_token']]));
        $this->assertSame('old', get_option(static::OPTION));
    }

    /**
     * Scenario "Other user".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_other_user(): void
    {
        $preview = $this->preview();

        wp_set_current_user(static::factory()->user->create(['role' => 'administrator']));

        $this->assertAsksForNewPreview($this->run_tool(['value' => 'new', 'confirmation_token' => $preview['confirmation_token']]));
        $this->assertSame('old', get_option(static::OPTION));
    }

    /**
     * Scenario "Token used two times".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_used_token(): void
    {
        $preview = $this->preview();
        $this->run_tool(['value' => 'new', 'confirmation_token' => $preview['confirmation_token']]);
        update_option(static::OPTION, 'old');

        $this->assertAsksForNewPreview($this->run_tool(['value' => 'new', 'confirmation_token' => $preview['confirmation_token']]));
        $this->assertSame('old', get_option(static::OPTION));
    }

    /**
     * A token older than 10 minutes is not valid.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_expired_token(): void
    {
        $preview = $this->preview();
        $key = ConfirmationTokens::TRANSIENT_PREFIX . hash('sha256', $preview['confirmation_token']);
        update_option('_transient_timeout_' . $key, time() - 1);

        $this->assertAsksForNewPreview($this->run_tool(['value' => 'new', 'confirmation_token' => $preview['confirmation_token']]));
        $this->assertSame('old', get_option(static::OPTION));
    }

    /**
     * Scenario "Record changed after the preview".
     *
     * @return void
     * @since 1.0.0
     */
    public function test_changed_record(): void
    {
        $preview = $this->preview();
        update_option(static::OPTION, 'changed in the admin');

        $this->assertAsksForNewPreview($this->run_tool(['value' => 'new', 'confirmation_token' => $preview['confirmation_token']]));
        $this->assertSame('changed in the admin', get_option(static::OPTION));
    }

    /**
     * Arguments are validated before the preview.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_arguments_are_validated(): void
    {
        try {
            $this->run_tool(['value' => str_repeat('a', 30)]);
            $this->fail('The tool did not reject the arguments.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('value', $exception->get_errors());
        }
    }

    /**
     * Scenario "Duplicate in one call": an additive tool does the change in the first call and has no token argument.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_additive_tool_runs_in_one_call(): void
    {
        $tool = $this->tool(false);

        $done = $this->run_tool(['value' => 'new'], $tool)->content();

        $this->assertSame(['status' => 'done', 'value' => 'new'], $done);
        $this->assertArrayNotHasKey('confirmation_token', $tool->input_schema(new JsonSchema()));
        $this->assertArrayHasKey('confirmation_token', $this->tool()->input_schema(new JsonSchema()));
    }

    /**
     * Scenario "Editor cannot change an order": only administrators pass the permission check.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_permission_needs_manage_options(): void
    {
        $this->assertTrue($this->tool()->permission());

        wp_set_current_user(static::factory()->user->create(['role' => 'editor']));
        $this->assertFalse($this->tool()->permission());
    }

    /**
     * Write tools are marked as not read-only and destructive by default.
     *
     * @return void
     * @since 1.0.0
     */
    public function test_default_annotations(): void
    {
        $tool = $this->tool();

        $this->assertFalse($tool->read_only());
        $this->assertTrue($tool->destructive());
        $this->assertFalse($tool->idempotent());
    }
}
