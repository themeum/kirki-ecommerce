<?php

namespace Kirki\Ecommerce\App\Migration\DTO;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\DTO;

/**
 * Data object holding the result of scanning a source.
 *
 * @since 1.0.0
 */
class ScanResultDTO extends DTO
{
    /** @var string */
    public $source;

    /** @var array<int, array{id: string, label: string, description: string, count: int}> */
    public $groups = [];

    /** @var array<int, array{slug: string, label: string, status: string}> */
    public $extensions = [];
}
