<?php

namespace Kirki\Ecommerce\Tests\Unit\Scheduler;

use Exception;
use Kirki\Ecommerce\Container;
use Kirki\Ecommerce\Scheduler\DTO\JobDTO;
use Kirki\Ecommerce\Scheduler\Repositories\QueueRepository;
use Kirki\Ecommerce\Scheduler\Runner;
use Kirki\Ecommerce\Tests\Unit\TestCase;
use PHPUnit\Framework\MockObject\MockObject;

class RunnerTest extends TestCase
{
    /** @var QueueRepository&MockObject */
    private $repository;

    /** @var TestRunner */
    private $runner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->repository = $this->createMock(QueueRepository::class);
        $this->runner = new TestRunner($this->repository);
    }

    public function test_validate_requires_resolver_class(): void
    {
        $this->expectException(Exception::class);
        $this->expectExceptionMessage('Missing resolver class');

        $this->runner->expose_validate((object) ['id' => 1]);
    }

    public function test_create_job_dto_decodes_json_args(): void
    {
        $job = $this->runner->expose_create_job_dto((object) [
            'id' => 7,
            'resolver' => RunnerTestResolver::class,
            'args' => wp_json_encode(['total' => 3]),
        ]);

        $this->assertInstanceOf(JobDTO::class, $job);
        $this->assertSame(7, $job->id);
        $this->assertSame(['total' => 3], $job->args);
    }

    public function test_resolve_executes_resolver_and_marks_job_completed(): void
    {
        $resolver = new RunnerTestResolver();
        $container = new Container();
        $container->instance('app', $container);
        $container->bind(RunnerTestResolver::class, fn() => $resolver);
        $this->set_container_instance($container);

        $this->repository
            ->expects($this->once())
            ->method('mark_as_completed')
            ->with(9);

        $job = JobDTO::from_array([
            'id' => 9,
            'resolver' => RunnerTestResolver::class,
            'args' => ['value' => 'done'],
        ]);

        $this->runner->expose_resolve($job, $this->repository);

        $this->assertSame(['value' => 'done'], $resolver->handled_args);
    }

    public function test_resolve_marks_job_failed_when_resolver_throws(): void
    {
        $container = new Container();
        $container->instance('app', $container);
        $container->bind(RunnerFailingResolver::class, fn() => new RunnerFailingResolver());
        $this->set_container_instance($container);

        $this->repository
            ->expects($this->once())
            ->method('mark_as_failed')
            ->with(11, 0);

        $job = JobDTO::from_array([
            'id' => 11,
            'resolver' => RunnerFailingResolver::class,
            'args' => [],
        ]);

        $this->runner->expose_resolve($job, $this->repository);
    }

    public function test_clean_failed_jobs_delegates_to_repository_cleanup(): void
    {
        $this->repository
            ->expects($this->once())
            ->method('cleanup')
            ->with('failed', 15)
            ->willReturn(true);

        $this->assertTrue($this->runner->clean_failed_jobs());
    }

    public function test_clean_completed_jobs_delegates_to_repository_cleanup(): void
    {
        $this->repository
            ->expects($this->once())
            ->method('cleanup')
            ->with('completed', 7)
            ->willReturn(true);

        $this->assertTrue($this->runner->clean_completed_jobs());
    }
}

class TestRunner extends Runner
{
    public function expose_validate($job): void
    {
        $this->validate($job);
    }

    public function expose_create_job_dto($job): JobDTO
    {
        return $this->create_job_dto($job);
    }

    public function expose_resolve(JobDTO $job, QueueRepository $repository): void
    {
        $this->resolve($job, $repository);
    }
}

class RunnerTestResolver
{
    public array $handled_args = [];

    public function handle(array $args): void
    {
        $this->handled_args = $args;
    }

    public function get_retry(): int
    {
        return 0;
    }
}

class RunnerFailingResolver
{
    public function handle(array $args): void
    {
        throw new Exception('resolver failed');
    }

    public function get_retry(): int
    {
        return 0;
    }
}
