<?php

namespace Kirki\Ecommerce\Tests\Support;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

use function Kirki\Ecommerce\Framework\app;

/**
 * Runs MCP write tools in tests: previews, confirmed changes and rejected calls.
 */
trait RunsWriteTools
{
    /**
     * Run a tool.
     *
     * @param string $tool      Tool class.
     * @param array  $arguments Tool arguments.
     *
     * @return Response
     * @since 1.0.0
     */
    protected function run_tool(string $tool, array $arguments)
    {
        return app()->make($tool)->handle(new Request($arguments));
    }

    /**
     * Get the preview of a change.
     *
     * @param string $tool      Tool class.
     * @param array  $arguments Tool arguments.
     *
     * @return array
     * @since 1.0.0
     */
    protected function preview(string $tool, array $arguments): array
    {
        $response = $this->run_tool($tool, $arguments);

        $this->assertFalse($response->is_error(), (string) json_encode($response->content()));
        $this->assertSame('preview', $response->content()['status']);

        return $response->content();
    }

    /**
     * Preview a change, then confirm it with the token.
     *
     * @param string $tool      Tool class.
     * @param array  $arguments Tool arguments.
     *
     * @return array The result of the confirmed call.
     * @since 1.0.0
     */
    protected function confirm(string $tool, array $arguments): array
    {
        $preview = $this->preview($tool, $arguments);
        $response = $this->run_tool($tool, $arguments + ['confirmation_token' => $preview['confirmation_token']]);

        $this->assertFalse($response->is_error(), (string) json_encode($response->content()));
        $this->assertSame('done', $response->content()['status']);

        return $response->content();
    }

    /**
     * Get the validation errors that a call throws.
     *
     * @param string $tool      Tool class.
     * @param array  $arguments Tool arguments.
     *
     * @return array<string, string[]>
     * @since 1.0.0
     */
    protected function errors(string $tool, array $arguments): array
    {
        try {
            $this->run_tool($tool, $arguments);
        } catch (ValidationException $exception) {
            return $exception->get_errors();
        }

        $this->fail('The tool did not reject the call.');
    }
}
