<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Order\OrderActivityType;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\App\Models\OrderActivity;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

class OrderActivityService
{
    /**
     * Persist a new order activity.
     *
     * @param int $order_id
     * @param string $activity_type
     * @param string|null $description
     * @param array|null $metadata
     * @param int|null $created_by
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
     * @param int $order_id
     * @param ListFilterDTO $filters
     * @return \Kirki\Ecommerce\Framework\Database\Query\Paginator
     */
    public function paginated_for_order(int $order_id, ListFilterDTO $filters)
    {
        return $this->list_query($order_id)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get all of an order's activities, newest first.
     *
     * @param int $order_id
     * @return \Kirki\Ecommerce\Framework\Collections\Collection
     */
    public function all_for_order(int $order_id)
    {
        return $this->list_query($order_id)->get();
    }

    /**
     * Base query for an order's activities, newest first.
     *
     * @param int $order_id
     * @return QueryBuilder
     */
    protected function list_query(int $order_id)
    {
        return OrderActivity::query()
            ->where('order_id', $order_id)
            ->order_by('created_at', 'desc')
            ->order_by('id', 'desc');
    }

    /**
     * Find an activity belonging to an order, or throw an exception.
     *
     * @param int $order_id
     * @param int $id
     * @return OrderActivity
     *
     * @throws NotFoundException
     */
    public function find_or_fail(int $order_id, int $id)
    {
        $activity = OrderActivity::query()
            ->where('order_id', $order_id)
            ->where('id', $id)
            ->first();

        if (!$activity) {
            throw new NotFoundException(__('Activity not found.', 'kirki-ecommerce'), Response::NOT_FOUND);
        }

        return $activity;
    }

    /**
     * Delete a comment activity from an order.
     *
     * Only comment-added activities can be deleted through this path;
     * every other activity type is a system record of what happened and
     * stays immutable.
     *
     * @param int $order_id
     * @param int $id
     * @return bool
     *
     * @throws NotFoundException When the activity does not exist on the order.
     * @throws ValidationException When the activity is not a comment.
     */
    public function delete_comment(int $order_id, int $id)
    {
        $activity = $this->find_or_fail($order_id, $id);

        if ($activity->activity_type !== OrderActivityType::COMMENT_ADDED) {
            throw new ValidationException(__('Only comments can be deleted.', 'kirki-ecommerce'), Response::UNPROCESSABLE_ENTITY);
        }

        return (bool) $activity->delete();
    }
}
