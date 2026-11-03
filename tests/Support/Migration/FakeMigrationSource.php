<?php

namespace Kirki\Ecommerce\Tests\Support\Migration;

use Kirki\Ecommerce\App\Migration\Contracts\MigrationSource;

/**
 * Migration source over fake groups, used to test the engine.
 */
class FakeMigrationSource implements MigrationSource
{
    /** @var FakeGroupMigrator[] */
    protected $groups;

    public function __construct(array $groups)
    {
        $this->groups = $groups;
    }

    public function id()
    {
        return 'fake';
    }

    public function label()
    {
        return 'Fake';
    }

    public function detect()
    {
        return true;
    }

    public function version_state()
    {
        return ['version' => '1.0.0', 'minimum' => '1.0.0', 'supported' => true];
    }

    public function extensions()
    {
        return [];
    }

    public function groups()
    {
        return $this->groups;
    }
}
