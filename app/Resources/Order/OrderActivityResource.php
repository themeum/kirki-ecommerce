<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

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
            'created_at' => $this->created_at ? $this->human_readable_time_diff($this->created_at) : '',
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

    /**
     * Get the human readable time difference between the current time and the given date
     *
     * @param string $date
     * @return string
     */
    protected function human_readable_time_diff(string $date)
    {
        $now = Date::now();
        $suffix = $now->lte($date) ? __('left', 'kirki-ecommerce') : __('ago', 'kirki-ecommerce');

        return sprintf('%s %s', human_time_diff(strtotime($date), strtotime($now->to_date_time_string())), $suffix);
    }
}
