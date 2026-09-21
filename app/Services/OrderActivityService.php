<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Models\Order;
use Kirki\Ecommerce\App\Models\OrderActivity;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Records and reads the activity timeline of orders.
 *
 * @since 1.0.0
 */
class OrderActivityService
{
    /**
     * Persist a new order activity.
     *
     * @since 1.0.0
     *
     * @param int                       $order_id      Order ID.
     * @param string                    $activity_type One of the OrderActivityType constants.
     * @param string|null               $description   Human-readable description.
     * @param array<string, mixed>|null $metadata      Extra structured data stored with the activity.
     * @param int|null                  $created_by    ID of the user who caused the activity, if any.
     * @return OrderActivity
     */
    public function create(int $order_id, string $activity_type, ?string $description, ?array $metadata, ?int $created_by)
    {
        return OrderActivity::create([
            'order_id' => $order_id,
            'activity_type' => $activity_type,
            'description' => $description,
            'metadata' => $metadata,
            'created_by' => $created_by,
        ]);
    }

    /**
     * Paginate an order's activities, newest first.
     *
     * @since 1.0.0
     *
     * @param int           $order_id Order ID.
     * @param ListFilterDTO $filters  Page and limit to use.
     * @return \Kirki\Ecommerce\Framework\Database\Query\Paginator
     */
    public function paginated_for_order(int $order_id, ListFilterDTO $filters)
    {
        return $this->list_query($order_id)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get all of an order's activities, newest first.
     *
     * @since 1.0.0
     *
     * @param int $order_id Order ID.
     * @return \Kirki\Ecommerce\Framework\Collections\Collection Collection of OrderActivity.
     */
    public function all_for_order(int $order_id)
    {
        return $this->list_query($order_id)->get();
    }

    /**
     * Get an order's activities for the customer-facing timeline, newest first.
     *
     * Comment and payment-completed activities are left out, and only the
     * activity_type and created_at columns are selected.
     *
     * @since 1.0.0
     *
     * @param int $order_id Order ID.
     * @return \Kirki\Ecommerce\Framework\Collections\Collection Collection of OrderActivity.
     */
    public function get_order_activity(int $order_id)
    {
        return $this->list_query( $order_id )
            ->where( 'activity_type', '!=', OrderActivityType::COMMENT_ADDED )
            ->where( 'activity_type', '!=', OrderActivityType::PAYMENT_COMPLETED ) // todo: will be replaced with private activity status
            ->get( ['activity_type','created_at'] );
    }

    /**
     * Base query for an order's activities, newest first.
     *
     * @since 1.0.0
     *
     * @param int $order_id Order ID.
     * @return QueryBuilder
     */
    protected function list_query(int $order_id)
    {
        return OrderActivity::query()
            ->where('order_id', $order_id)
            ->order_by('id', 'desc');
    }

    /**
     * Find an activity belonging to an order, or throw an exception.
     *
     * @since 1.0.0
     *
     * @param int $order_id Order ID.
     * @param int $id       Activity ID.
     * @return OrderActivity
     * @throws NotFoundException When the activity does not exist on the order.
     */
    public function find_or_fail(int $order_id, int $id)
    {
        $activity = OrderActivity::query()
            ->where('order_id', $order_id)
            ->where('id', $id)
            ->first();

        throw_if(!$activity, __('Activity not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $activity;
    }

    /**
     * Delete a comment activity from an order.
     *
     * Only comment-added activities can be deleted through this path;
     * every other activity type is a system record of what happened and
     * stays immutable.
     *
     * @since 1.0.0
     *
     * @param int $order_id Order ID.
     * @param int $id       Activity ID.
     * @return bool True when the activity was deleted.
     * @throws NotFoundException   When the activity does not exist on the order.
     * @throws ValidationException When the activity is not a comment.
     */
    public function delete_comment(int $order_id, int $id)
    {
        $activity = $this->find_or_fail($order_id, $id);

        throw_if($activity->activity_type !== OrderActivityType::COMMENT_ADDED, __('Only comments can be deleted.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        return (bool) $activity->delete();
    }
}
