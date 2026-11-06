<?php

namespace Kirki\Ecommerce\App\Console\Commands;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Console\CommandBase;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

/**
 * Removes the onboarding completion option so the setup wizard shows again.
 *
 * @since 1.0.0
 */
class ResetOnboardingCommand extends CommandBase
{
    /**
     * Run the command.
     *
     * @since 1.0.0
     *
     * @param mixed $args  The positional arguments.
     * @param mixed $assoc The associative arguments.
     * @return void
     */
    public function run($args, $assoc)
    {
        if (!Option::delete(OptionKeys::ONBOARDING_COMPLETED_AT)) {
            $this->cli_warning('The onboarding option was not found. Nothing was removed.');
            return;
        }

        $this->cli_success('The onboarding option was removed. The setup wizard shows again.');
    }

    /**
     * Prepare the command summary and description.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function prepare()
    {
        $this->summary('Remove the onboarding completion option')
            ->description("## EXAMPLES \n\n wp kirki onboarding:reset");
    }
}
