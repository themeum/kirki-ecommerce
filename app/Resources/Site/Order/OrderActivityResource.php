<?php 

namespace Kirki\Ecommerce\App\Resources\Site\Order;

use Kirki\Ecommerce\App\Resources\Order\OrderActivityResource as BaseOrderActivityResource;

/**
 * API resource for an entry in an order's activity timeline as shown to the customer.
 *
 * @since 1.0.0
 */
class OrderActivityResource extends BaseOrderActivityResource
{

    /**
     * Convert the order activity resource to an array.
     *
     * Exposes only the activity type and creation time, unlike the admin resource.
     *
     * @since 1.0.0
     *
     * @return array<string, mixed> The activity type and creation date.
     */
    public function to_array(): array
    {
        return [
            'activity_type' => $this->activity_type,
            'created_at' => $this->created_at
        ];
    }
}