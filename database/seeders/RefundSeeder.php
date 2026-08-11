<?php

namespace Kirki\Ecommerce\Database\Seeders;

use Kirki\Ecommerce\App\Models\Refund;
use Kirki\Ecommerce\Framework\Database\Seeder;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

class RefundSeeder extends Seeder
{
    /**
     * Seed sample refund record against seeded order.
     *
     * @return void
     * @since 1.0.0
     */
    public function run(): void
    {
        Refund::create([
            'order_id' => 1,
            'status' => 'completed',
            'invoiced_amount' => 2500,
            'reason' => 'Customer requested partial refund for returned item.',
            'refund_type' => 'partial',
            'refund_id' => 're_sample_123456789',
        ]);

        Log::info('RefundSeeder run successfully');
    }
}
