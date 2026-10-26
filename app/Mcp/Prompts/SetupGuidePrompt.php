<?php

namespace Kirki\Ecommerce\App\Mcp\Prompts;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Mcp\Tools\SetupStatusTool;

/**
 * The open setup steps in order, with links to their admin pages.
 *
 * @since 1.0.0
 */
class SetupGuidePrompt extends StorePrompt
{
    /** @var string */
    protected $title = 'Setup guide';

    /** @var string */
    protected $description = 'The open store setup steps in order, each with a link to its admin page. Read-only.';

    /**
     * Build the prompt message.
     *
     * @since 1.0.0
     *
     * @param Request $request The prompt fetch.
     *
     * @return Response[]
     */
    public function handle(Request $request)
    {
        return [
            Response::text($this->message([
                __('Tell me what I must do next to finish setting up my store.', 'kirki-ecommerce'),
                $this->read_only_rule(),
                __('Call this store tool:', 'kirki-ecommerce') . "\n" . $this->tool_call(SetupStatusTool::class),
                __('Answer with the open steps in their order, each with its "admin_page" link. If all steps are completed, say that setup is complete.', 'kirki-ecommerce'),
            ])),
        ];
    }
}
