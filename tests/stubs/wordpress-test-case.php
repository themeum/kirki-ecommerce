<?php

abstract class WP_UnitTestCase extends \PHPUnit\Framework\TestCase
{
    protected static function factory(): WP_UnitTest_Factory
    {
        return new WP_UnitTest_Factory();
    }
}

class WP_UnitTest_Factory
{
    public WP_UnitTest_Factory_For_Thing $user;

    public function __construct()
    {
        $this->user = new WP_UnitTest_Factory_For_Thing();
    }
}

class WP_UnitTest_Factory_For_Thing
{
    public function create(array $args = []): int
    {
        return 0;
    }
}
