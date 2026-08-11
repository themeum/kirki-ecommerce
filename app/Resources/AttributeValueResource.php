<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\MediaAttachment;

class AttributeValueResource extends Resource
{
    /**
     * Convert the tag resource to an array.
     *
     * @return array The tag data as an associative array.
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
