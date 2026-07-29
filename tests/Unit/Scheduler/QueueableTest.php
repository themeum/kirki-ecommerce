<?php

namespace Kirki\Ecommerce\Tests\Unit\Scheduler;

use Kirki\Ecommerce\App\Scheduler\Concerns\Queueable;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class QueueableTest extends TestCase
{
    public function test_args_stores_values_as_array(): void
    {
        $job = new QueueableTestJob();
        $job->args(['product_id' => 5]);

        $this->assertSame(['product_id' => 5], $job->get_args());
    }

    public function test_get_priority_clamps_between_zero_and_two_fifty_five(): void
    {
        $job = new QueueableTestJob();

        $job->priority(-10);
        $this->assertSame(0, $job->get_priority());

        $job->priority(500);
        $this->assertSame(255, $job->get_priority());
    }

    public function test_delay_and_retry_are_configurable(): void
    {
        $job = new QueueableTestJob();
        $job->delay(30)->retry(2);

        $this->assertSame(30, $job->get_delay());
        $this->assertSame(2, $job->get_retry());
    }

    public function test_get_resolver_returns_job_class_name(): void
    {
        $job = new QueueableTestJob();

        $this->assertSame(QueueableTestJob::class, $job->get_resolver());
    }
}

class QueueableTestJob
{
    use Queueable;

    public function handle(array $args): void
    {
    }
}
