<?php

namespace Kirki\Ecommerce\App\Contracts;


interface RecurrableScheduler extends Action
{
    /**
     * @since 1.0.0
     * @return bool
     */
    public function should_stop();

    /**
     * @since 1.0.0
     * @return array|false
     */
    public function get_additional_args();
}
