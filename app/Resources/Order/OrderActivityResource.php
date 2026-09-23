<?php

namespace Kirki\Ecommerce\App\Resources\Order;

use Kirki\Ecommerce\App\Facades\OrderActivity;
use Kirki\Ecommerce\Framework\Resource;
use Kirki\Ecommerce\Framework\Supports\Facades\Date;

/**
 * API resource for an entry in an order's activity timeline (admin).
 *
 * @since 1.0.0
 */
class OrderActivityResource extends Resource
{
    /**
     * Convert the order activity resource to an array.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The activity data, with a rendered description, author name and relative time.
     */
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

    /**
     * Resolve the display name of the WordPress user who created the activity.
     *
     * @since 1.0.0
     *
     * @return string|null Null when there is no creator or the user no longer exists.
     */
    protected function resolve_author_name()
    {
        if (empty($this->created_by)) {
            return null;
        }

        $wp_user = get_userdata($this->created_by);

        return $wp_user ? $wp_user->display_name : null;
    }

    /**
     * Get the human readable time difference between the current time and the given date.
     *
     * @since 1.0.0
     *
     * @param string $date Date-time string to compare with now.
     * @return string Difference suffixed with "left" for future dates or "ago" otherwise.
     */
    protected function human_readable_time_diff(string $date)
    {
        $now = Date::now();
        $suffix = $now->lte($date) ? __('left', 'kirki-ecommerce') : __('ago', 'kirki-ecommerce');

        return sprintf('%s %s', human_time_diff(strtotime($date), strtotime($now->to_date_time_string())), $suffix);
    }
}
