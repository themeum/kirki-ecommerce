<?php

namespace Kirki\Ecommerce\App\Migration\Http\Requests;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates and sanitizes the payload for scanning a migration source.
 *
 * @since 1.0.0
 */
class MigrationScanRequest extends Request
{
    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function rules()
    {
        return [
            'source' => 'required|string',
        ];
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function filters()
    {
        return [
            'source' => Sanitizer::KEY,
        ];
    }
}
