<?php

namespace Kirki\Ecommerce;


abstract class ServiceProvider
{
    /** @var Application */
    protected $app;

    /**
     * Create a new service provider constructor
     *
     * @param Application $app
     * @return void
     */
    public function __construct(Application $app)
    {
        $this->app = $app;
    }

    /**
     * Register the service provider.
     *
     * @return void
     */
    abstract public function register();

    /**
     * Boot the service provider.
     *
     * @return void
     */
    public function boot()
    {
        //
    }
}
