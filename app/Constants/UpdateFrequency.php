<?php

namespace Kirki\Ecommerce\App\Constants;

use Kirki\Ecommerce\Concerns\HasConstants;

class UpdateFrequency
{
    use HasConstants;
    public const EVERY_15_MIN = 'every_15_min';
    public const EVERY_30_MIN = 'every_30_min';
    public const EVERY_1_HOUR = 'every_1_hour';
    public const EVERY_6_HOURS = 'every_6_hours';
    public const EVERY_12_HOURS = 'every_12_hours';
    public const DAILY_24_HOURS = 'daily_24_hours';
}
