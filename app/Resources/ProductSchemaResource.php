<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;

/**
 * API resource for a product schema definition.
 *
 * @since 1.0.0
 */
class ProductSchemaResource extends Resource
{
    /**
     * Convert the product schema resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The schema data, including its default flag and schema definition.
     */
    public function to_array()
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'is_default' => $this->is_default,
            'schema' => $this->schema,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
