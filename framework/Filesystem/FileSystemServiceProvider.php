<?php

namespace Kirki\Ecommerce\Filesystem;

use Kirki\Ecommerce\ServiceProvider;

class FileSystemServiceProvider extends ServiceProvider
{
    public function register()
    {
        $this->app->alias('files', Filesystem::class);
        $this->app->singleton(Filesystem::class);
    }
}
