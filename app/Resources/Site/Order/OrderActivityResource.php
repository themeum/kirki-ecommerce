<?php 

namespace Kirki\Ecommerce\App\Resources\Site\Order;

use Kirki\Ecommerce\App\Resources\Order\OrderActivityResource as BaseOrderActivityResource;

class OrderActivityResource extends BaseOrderActivityResource
{

    public function to_array(): array
    {
        return [
            'activity_type' => $this->activity_type,
            'created_at' => $this->created_at
        ];
    }
}