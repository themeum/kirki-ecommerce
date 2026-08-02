<?php

namespace Kirki\Ecommerce\App\Resources;

use Dom\Attr;
use Kirki\Ecommerce\Framework\Resource;

class AttributeResource extends Resource
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
            'name' => $this->name,
            'slug' => $this->slug,
            'type' => $this->type,
            'values' => AttributeValueResource::collection($this->values ?? []),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
