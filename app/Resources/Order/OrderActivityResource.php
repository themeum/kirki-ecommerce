<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Resource;

class OrderActivityResource extends Resource
{
    public function to_array()
    {
        return [
            'id' => $this->id,
            'order_id' => $this->order_id,
            'activity_type' => $this->activity_type,
            'description' => OrderActivity::describe($this->resource),
            'created_by' => $this->created_by,
            'author_name' => $this->resolve_author_name(),
            'created_at' => $this->created_at,
        ];
    }

    protected function resolve_author_name()
    {
        if (empty($this->created_by)) {
            return null;
        }

        $wp_user = get_userdata($this->created_by);

        return $wp_user ? $wp_user->display_name : null;
    }
}
