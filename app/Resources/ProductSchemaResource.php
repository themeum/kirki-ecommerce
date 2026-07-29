<?php

namespace Kirki\Ecommerce\App\Resources;

use Kirki\Ecommerce\Framework\Resource;

class ProductSchemaResource extends Resource
{
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
