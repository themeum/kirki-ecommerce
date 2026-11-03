<?php

namespace Kirki\Ecommerce\App\Migration\Http\Requests;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Framework\Http\Request;
use Kirki\Ecommerce\Framework\Sanitizer;

/**
 * Validates and sanitizes the payload for starting a migration run.
 *
 * @since 1.0.0
 */
class MigrationStartRequest extends Request
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
            'groups' => 'required|array',
            'groups.*' => 'string',
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
            'groups' => Sanitizer::ARRAY,
            'groups.*' => Sanitizer::KEY,
        ];
    }
}
