<?php

namespace Kirki\Ecommerce\Tests\Unit\Scheduler;

use Kirki\Ecommerce\Scheduler\DTO\JobDTO;
use Kirki\Ecommerce\Tests\Unit\TestCase;

class JobDTOTest extends TestCase
{
    public function test_from_array_maps_job_fields(): void
    {
        $job = JobDTO::from_array([
            'id' => 12,
            'resolver' => SchedulerTestResolver::class,
            'args' => ['status' => 'pending'],
        ]);

        $this->assertSame(12, $job->id);
        $this->assertSame(SchedulerTestResolver::class, $job->resolver);
        $this->assertSame(['status' => 'pending'], $job->args);
    }
}

class SchedulerTestResolver
{
    public function handle(array $args): void
    {
    }
}
