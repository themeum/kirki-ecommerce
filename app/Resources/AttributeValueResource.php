<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

/**
 * API resource for a single product attribute value.
 *
 * @since 1.0.0
 */
class AttributeValueResource extends Resource
{
    /**
     * Convert the attribute value resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The attribute value data.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'value' => $this->value,
            'color' => $this->color,
            'media' => MediaAttachment::make($this->media),
        ];
    }
}
