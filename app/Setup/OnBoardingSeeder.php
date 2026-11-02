<?php

namespace Kirki\Ecommerce\App\Setup;

use Kirki\Ecommerce\Framework\Database\Seeder;

defined('ABSPATH') || exit;

/**
 * Entry seeder that queues the baseline onboarding seeders run during store setup.
 *
 * @since 1.0.0
 */
class OnBoardingSeeder extends Seeder
{
    /**
     * Queue the seeder that gives a newly set up store its baseline settings.
     *
     * The merchant's onboarding answers, written after this seeder drains, merge
     * over the defaults. The seeder guards its own target, so this is safe to
     * reach more than once. Categories, attributes and schema profiles come from
     * the store presets, and demo products are loaded on request through the
     * sample data importer.
     *
     * This queues only - the caller invokes the seeder to drain the queue.
     *
     * @since 1.0.0
     *
     * @return void
     */
    public function run(): void
    {
        $this->call([
            SettingsSeeder::class,
        ]);
    }
}
