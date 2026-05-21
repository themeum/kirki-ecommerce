<?php

namespace Kirki\Ecommerce\Tests\Unit\Scheduler;

use Kirki\Ecommerce\Scheduler\DeferredDispatcher;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class DeferredDispatcherTest extends TestCase
{
    public function test_delay_and_priority_delegate_to_job(): void
    {
        $job = new DeferredDispatcherTestJob();
        $dispatcher = new DeferredDispatcher($job);

        $result = $dispatcher->delay(15)->priority(3);

        $this->assertSame($dispatcher, $result);
        $this->assertSame(15, $job->get_delay());
        $this->assertSame(3, $job->get_priority());
    }

    public function test_without_delay_clears_scheduled_delay(): void
    {
        $job = new DeferredDispatcherTestJob();
        $job->delay(30);

        $dispatcher = new DeferredDispatcher($job);
        $dispatcher->without_delay();

        $this->assertNull($job->get_delay());
    }

    public function test_destruct_stores_job_and_triggers_async_worker_when_not_delayed(): void
    {
        $job = new DeferredDispatcherTestJob();

        $this->assertFalse($job->stored);
        $this->assertFalse($job->async_triggered);

        $dispatcher = new DeferredDispatcher($job);
        unset($dispatcher);

        $this->assertTrue($job->stored);
        $this->assertTrue($job->async_triggered);
    }

    public function test_destruct_stores_job_without_triggering_async_worker_when_delayed(): void
    {
        $job = new DeferredDispatcherTestJob();
        $job->delay(60);

        $dispatcher = new DeferredDispatcher($job);
        unset($dispatcher);

        $this->assertTrue($job->stored);
        $this->assertFalse($job->async_triggered);
    }
}

class DeferredDispatcherTestJob
{
    use \Kirki\Ecommerce\Scheduler\Concerns\Queueable {
        trigger_async_worker as protected queueable_trigger_async_worker;
        store as protected queueable_store;
    }

    public bool $stored = false;
    public bool $async_triggered = false;

    public function store(): void
    {
        $this->stored = true;
    }

    public function trigger_async_worker(): void
    {
        $this->async_triggered = true;
    }

    public function handle(array $args): void
    {
    }
}
