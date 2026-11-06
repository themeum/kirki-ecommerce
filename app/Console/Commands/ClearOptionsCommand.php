<?php

namespace Kirki\Ecommerce\App\Console\Commands;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Constants\OptionKeys;
use Kirki\Ecommerce\Framework\Console\CommandBase;
use Kirki\Ecommerce\Framework\Console\Synopsis;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Kirki\Ecommerce\Framework\Supports\Facades\Option;

use function Kirki\Ecommerce\Framework\with_prefix;

/**
 * Deletes every option of the plugin, or only the onboarding option with --onboarding.
 *
 * @since 1.0.0
 */
class ClearOptionsCommand extends CommandBase
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
        if (!empty($assoc['onboarding'])) {
            $this->clear_onboarding();
            return;
        }

        $this->clear_all();
    }

    /**
     * Delete the onboarding completion option.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function clear_onboarding()
    {
        if (!Option::delete(OptionKeys::ONBOARDING_COMPLETED_AT)) {
            $this->cli_warning('The onboarding option was not found. Nothing was removed.');
            return;
        }

        $this->cli_success('The onboarding option was removed. The setup wizard shows again.');
    }

    /**
     * Delete every option that starts with the plugin prefix.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function clear_all()
    {
        $prefix = with_prefix('');

        // The LIKE underscores are wildcards, so the exact prefix is checked again below.
        $names = DB::table('options')
            ->where_like('option_name', $prefix . '%')
            ->pluck('option_name')
            ->filter(fn($name) => strpos($name, $prefix) === 0)
            ->all();

        foreach ($names as $name) {
            Option::delete($name, false);
        }

        $this->cli_success(sprintf('%d option(s) removed.', count($names)));
    }

    /**
     * Prepare the command summary, description and synopsis.
     *
     * @since 1.0.0
     *
     * @return void
     */
    protected function prepare()
    {
        $this->summary('Delete the plugin options')
            ->description("## EXAMPLES \n\n wp kirki options:clear \n\n wp kirki options:clear --onboarding")
            ->synopsis(Synopsis::type('flag')->name('onboarding')->description('Delete only the onboarding option, not every option')->optional());
    }
}
