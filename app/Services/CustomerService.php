<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Constants\Order\PaymentStatus;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Constants\Pagination;
use Kirki\Ecommerce\Framework\Database\Query\Paginator;
use Kirki\Ecommerce\Framework\Database\Query\QueryBuilder;
use Kirki\Ecommerce\App\DTO\ListFilterDTO;
use Kirki\Ecommerce\Framework\Collections\Collection;
use Kirki\Ecommerce\App\DTO\Customer\CreateCustomerDTO;
use Kirki\Ecommerce\App\DTO\Customer\UpdateCustomerDTO;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Http\Response;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Exception;

use function Kirki\Ecommerce\Framework\user;

class CustomerService
{
    /**
     * Return paginated customers
     *
     * @param ListFilterDTO $filters
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Return all customers
     *
     * @param ListFilterDTO $filters
     * @return Collection
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a customer by ID.
     *
     * @param int $id
     * @return Customer
     * @throws NotFoundException
     */
    public function find(int $id)
    {
        $customer = Customer::with('billing_address', 'shipping_address')->find($id);

        if (empty($customer)) {
            throw new NotFoundException(__('Customer not found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return $customer;
    }

    /**
     * Find a customer by their user ID.
     *
     * @param int $id
     * @return Customer|null
     */
    public function find_by_user_id(int $user_id)
    {
        $customer = Customer::with('billing_address', 'shipping_address')->where('user_id', $user_id)->first();

        return $customer;
    }

    /**
     * Create a new customer.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param CreateCustomerDTO $data
     * @return Customer
     */
    public function create(CreateCustomerDTO $data)
    {
        if (!empty($data->user_id) && $this->find_by_user_id($data->user_id)) {
            throw new Exception(__('Customer already exists', 'kirki-ecommerce')); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $data_array = $data->all();

        $data_array['created_by'] = $data->created_by ?? user()->get_id();
        $data_array['updated_by'] = $data->updated_by ?? user()->get_id();

        return Customer::create($data_array)->load('addresses');
    }

    /**
     * Updates a customer.
     *
     * If no slug is provided, it will be generated from the name.
     *
     * @param UpdateCustomerDTO $data
     * @throws NotFoundException
     * @return Customer
     */
    public function update(UpdateCustomerDTO $data)
    {
        $customer = Customer::with('billing_address', 'shipping_address')->find($data->id);

        if (empty($customer)) {
            throw new NotFoundException(__('Customer could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $data_array = $data->all();
        $data_array['updated_by'] = user()->get_id();

        $is_updated = (bool) $customer->update($data_array);

        if (!$is_updated) {
            throw new NotFoundException(__('Customer could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        if (!empty($data->user_id) && $this->find_by_user_id($customer->user_id)) {
            wp_update_user([
                'ID' => $customer->user_id,
                'user_email' => $data->email
            ]);
        }

        return $this->find($data->id);
    }

    /**
     * Partially updates a customer's own record.
     *
     * Unlike update(), this writes only the columns present in $data -
     * anything not present is left untouched. The caller is responsible for
     * only passing profile-appropriate columns (first_name, last_name,
     * phone); this method itself does not restrict which fillable Customer
     * columns can be written.
     *
     * @param int $customer_id
     * @param array $data
     * @throws NotFoundException
     * @return Customer
     */
    public function update_profile(int $customer_id, array $data)
    {
        $customer = $this->find($customer_id);

        if (empty($customer)) {
            throw new NotFoundException(__('Customer could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $data['updated_by'] = user()->get_id();

        $is_updated = (bool) $customer->update($data);

        if (!$is_updated) {
            throw new NotFoundException(__('Customer could not be updated.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        return $this->find($customer_id);
    }

    /**
     * Set whether a customer's billing address should mirror their shipping address.
     *
     * @param int $customer_id
     * @param bool $value
     * @throws NotFoundException
     * @return Customer
     */
    public function set_billing_same_as_shipping(int $customer_id, bool $value)
    {
        $customer = Customer::find($customer_id);

        if (empty($customer)) {
            throw new NotFoundException(__('Customer could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $customer->update([
            'is_billing_same_as_shipping' => $value,
            'updated_by' => user()->get_id(),
        ]);

        return $customer;
    }

    /**
     * Deletes a customer by ID.
     *
     * @param int $id The ID of the customer to delete.
     * @return bool True if the customer was deleted successfully, false otherwise.
     * @throws NotFoundException If the customer could not be found or deleted.
     */
    public function delete(int $id)
    {
        $customer = Customer::with('billing_address', 'shipping_address')->find($id);

        if (empty($customer)) {
            throw new NotFoundException(__('Customer could not be found.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        $is_deleted = (bool) Customer::query()->where('id', $id)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Customer could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        if (!function_exists('wp_delete_user')) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }

        wp_delete_user($customer->user_id);

        return true;
    }

    /**
     * Deletes multiple customers by their IDs.
     *
     * @param array $ids The IDs of the customers to delete.
     * @return bool True if the customers were deleted successfully, false otherwise.
     * @throws NotFoundException If the customers could not be found or deleted.
     */
    public function bulk_delete(array $ids)
    {
        $user_ids = Customer::where_in('id', $ids)->get()->pluck('user_id')->all();
        $is_deleted = (bool) Customer::where_in('id', $ids)->delete();

        if (!$is_deleted) {
            throw new NotFoundException(__('Customers could not be deleted.', 'kirki-ecommerce'), Response::NOT_FOUND); // phpcs:ignore WordPress.Security.EscapeOutput.ExceptionNotEscaped -- Caught centrally in Route.php; ApiExceptionHandler puts the message into a JSON response (HTML-escaping would corrupt it) and SiteExceptionHandler already calls esc_html() once before wp_die().
        }

        if (!function_exists('wp_delete_user')) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }

        foreach ($user_ids as $user_id) {
            wp_delete_user($user_id);
        }

        return true;
    }

    /**
     * Deletes all customers.
     *
     * @param ListFilterDTO $filters
     * @return bool True if successfully
     * @throws Exception If the customers could not be deleted.
     */
    public function delete_all(ListFilterDTO $filters)
    {
        DB::begin_transaction();

        try {
            $this->all($filters)->each(function ($customer) {
                if (!function_exists('wp_delete_user')) {
                    require_once ABSPATH . 'wp-admin/includes/user.php';
                }

                wp_delete_user($customer->user_id);
            });

            $is_deleted = (bool) $this->list_query($filters)->delete();

            DB::commit();

            return $is_deleted;
        } catch (Exception $e) {
            DB::roll_back();
            throw $e;
        }
    }

    protected function list_query(ListFilterDTO $filters)
    {
        return Customer::query()
            ->filter_with_datetime_range($filters->from_date, $filters->to_date)
            ->with_max('orders', 'created_at')
            ->with_count('orders')
            ->with_sum(['orders' => fn($query) => $query->where('payment_status', PaymentStatus::PAID)], 'base_total')
            ->with('billing_address')
            ->when($filters->search, function (QueryBuilder $query, $search) {
                return $query->where_any(['first_name', 'last_name', 'email', 'phone'], 'like', '%' . $search . '%');
            })
            ->when(!empty($filters->sort_by) && !empty($filters->sort_order), function (QueryBuilder $query) use ($filters) {
                return $query->order_by($filters->sort_by, $filters->sort_order);
            }, function (QueryBuilder $query) {
                return $query->order_by('id', 'desc');
            });
    }
}
