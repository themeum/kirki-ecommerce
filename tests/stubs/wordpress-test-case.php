<?php

abstract class WP_UnitTestCase extends \PHPUnit\Framework\TestCase
{
    /**
     * Return the WordPress test factory.
     *
     * @return WP_UnitTest_Factory
     * @since 1.0.0
     */
    protected static function factory(): WP_UnitTest_Factory
    {
        return new WP_UnitTest_Factory();
    }
}

class WP_UnitTest_Factory
{
    /**
     * User factory helper.
     *
     * @var WP_UnitTest_Factory_For_Thing
     * @since 1.0.0
     */
    public WP_UnitTest_Factory_For_Thing $user;

    /**
     * Initialize factory helpers.
     *
     * @return void
     * @since 1.0.0
     */
    public function __construct()
    {
        $this->user = new WP_UnitTest_Factory_For_Thing();
    }
}

class WP_UnitTest_Factory_For_Thing
{
    /**
     * Create a test record.
     *
     * @param array $args Creation arguments.
     *
     * @return int
     * @since 1.0.0
     */
    public function create(array $args = []): int
    {
        return 0;
    }
}
