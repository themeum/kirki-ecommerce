<?php

namespace Kirki\Ecommerce\App\Resources;

use Dom\Attr;
use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a product attribute and its values.
 *
 * @since 1.0.0
 */
class AttributeResource extends Resource
{
    /**
     * Convert the attribute resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The attribute data, including its values.
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
