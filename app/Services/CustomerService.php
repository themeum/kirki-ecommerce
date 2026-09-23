<?php

namespace Kirki\Ecommerce\App\Services;

use Kirki\Ecommerce\App\Concerns\HasSortableColumns;
use Kirki\Ecommerce\App\Models\Address;
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

use function Kirki\Ecommerce\Framework\throw_if;
use function Kirki\Ecommerce\Framework\user;

/**
 * Manages customers: listing with order stats, lookup, CRUD and location options.
 *
 * @since 1.0.0
 */
class CustomerService
{
    use HasSortableColumns;

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    protected function sortable_columns()
    {
        return [
            'id' => 'id',
            'user_id' => 'user_id',
            'first_name' => 'first_name',
            'last_name' => 'last_name',
            'email' => 'email',
            'phone' => 'phone',
            'orders_count' => 'orders_count',
            'base_amount_spent' => 'orders_sum_base_total',
            'last_order_date' => 'orders_max_created_at',
            'location' => function () {
                return Address::where_raw('customer_id = cid')
                    ->where('is_default_billing', true)
                    ->limit(1)
                    ->select_raw("concat_ws(', ', state, country)");
            },
            'created_by' => 'created_by',
            'updated_by' => 'updated_by',
            'created_at' => 'created_at',
            'updated_at' => 'updated_at',
        ];
    }

    /**
     * Get a page of customers, with order stats, matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, date range, location, sorting and pagination.
     * @return Paginator
     */
    public function paginated(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->paginate($filters->limit ?? Pagination::LIMIT, $filters->page ?? 1);
    }

    /**
     * Get every customer, with order stats, matching the filters.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, date range, location and sorting.
     * @return Collection Collection of Customer models.
     */
    public function all(ListFilterDTO $filters)
    {
        return $this->list_query($filters)->get();
    }

    /**
     * Find a customer, with billing and shipping addresses, by ID.
     *
     * @since 1.0.0
     *
     * @param int $id Customer ID.
     * @return Customer
     * @throws NotFoundException When the customer does not exist.
     */
    public function find(int $id)
    {
        $customer = Customer::with('billing_address', 'shipping_address', 'addresses')->find($id);

        throw_if(empty($customer), __('Customer not found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $customer;
    }

    /**
     * Find a customer, with billing and shipping addresses, by WordPress user ID.
     *
     * @since 1.0.0
     *
     * @param int $user_id WordPress user ID.
     * @return Customer|null
     */
    public function find_by_user_id(int $user_id)
    {
        $customer = Customer::with('billing_address', 'shipping_address')->where('user_id', $user_id)->first();

        return $customer;
    }

    /**
     * Find a customer, with billing and shipping addresses, by email.
     *
     * @since 1.0.0
     *
     * @param string $email Customer email.
     * @return Customer|null
     */
    public function find_by_email(string $email)
    {
        $customer = Customer::with('billing_address', 'shipping_address')->where('email', $email)->first();

        return $customer;
    }

    /**
     * Create a new customer.
     *
     * Creator and updater default to the current user.
     *
     * @since 1.0.0
     *
     * @param CreateCustomerDTO $data Customer data.
     * @return Customer The new customer with its addresses loaded.
     * @throws Exception When a customer already exists for the given user ID.
     */
    public function create(CreateCustomerDTO $data)
    {
        throw_if(!empty($data->user_id) && $this->find_by_user_id($data->user_id), __('Customer already exists', 'kirki-ecommerce'));

        $data_array = $data->all();

        $data_array['created_by'] = $data->created_by ?? user()->get_id();
        $data_array['updated_by'] = $data->updated_by ?? user()->get_id();

        return Customer::create($data_array)->load('addresses');
    }

    /**
     * Update a customer.
     *
     * @since 1.0.0
     *
     * @param UpdateCustomerDTO $data Customer data including the ID.
     * @return Customer The refreshed customer.
     * @throws NotFoundException When the customer does not exist or cannot be updated.
     */
    public function update(UpdateCustomerDTO $data)
    {
        $customer = Customer::with('billing_address', 'shipping_address', 'addresses')->find($data->id);

        throw_if(empty($customer), __('Customer could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $data_array = $data->all();
        $data_array['updated_by'] = user()->get_id();

        $is_updated = (bool) $customer->update($data_array);

        throw_if(!$is_updated, __('Customer could not be updated.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $this->find($data->id);
    }

    /**
     * Update a customer's email to match its linked WordPress user's new email.
     *
     * No-ops when no customer is linked to the given WordPress user.
     *
     * @since 1.0.0
     *
     * @param int    $user_id WordPress user ID whose email changed.
     * @param string $email   The WordPress user's new email.
     * @return void
     */
    public function sync_email_from_wordpress_user(int $user_id, string $email)
    {
        $customer = $this->find_by_user_id($user_id);

        if (empty($customer)) {
            return;
        }

        $customer->update(['email' => $email]);
    }

    /**
     * Link an existing, unlinked customer to a newly created WordPress user.
     *
     * No-ops when no customer matches the given email, or when the matching
     * customer already has a linked WordPress user - an existing link is
     * never overwritten.
     *
     * @since 1.0.0
     *
     * @param string $email   Email shared by the WordPress user and the customer.
     * @param int    $user_id Newly created WordPress user ID.
     * @return void
     */
    public function attach_wordpress_user(string $email, int $user_id)
    {
        $customer = $this->find_by_email($email);

        if (empty($customer) || !empty($customer->user_id)) {
            return;
        }

        $customer->update(['user_id' => $user_id]);
    }

    /**
     * Partially update a customer's own record.
     *
     * Unlike update(), this writes only the columns present in $data -
     * anything not present is left untouched. The caller is responsible for
     * only passing profile-appropriate columns (first_name, last_name,
     * phone); this method itself does not restrict which fillable Customer
     * columns can be written.
     *
     * @since 1.0.0
     *
     * @param int                  $customer_id Customer ID.
     * @param array<string, mixed> $data        Columns to change.
     * @return Customer The refreshed customer.
     * @throws NotFoundException When the customer does not exist or cannot be updated.
     */
    public function update_profile(int $customer_id, array $data)
    {
        $customer = $this->find($customer_id);

        throw_if(empty($customer), __('Customer could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $data['updated_by'] = user()->get_id();

        $is_updated = (bool) $customer->update($data);

        throw_if(!$is_updated, __('Customer could not be updated.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $this->find($customer_id);
    }

    /**
     * Delete a customer by ID, along with the linked WordPress user.
     *
     * @since 1.0.0
     *
     * @param int $id Customer ID.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When the customer does not exist or cannot be deleted.
     */
    public function delete(int $id)
    {
        $customer = Customer::with('billing_address', 'shipping_address')->find($id);

        throw_if(empty($customer), __('Customer could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        $is_deleted = (bool) Customer::query()->where('id', $id)->delete();

        throw_if(!$is_deleted, __('Customer could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        if (!function_exists('wp_delete_user')) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }

        wp_delete_user($customer->user_id);

        return true;
    }

    /**
     * Delete multiple customers by their IDs, along with their linked WordPress users.
     *
     * @since 1.0.0
     *
     * @param int[] $ids Customer IDs.
     * @return bool Always true; failure is signalled by an exception.
     * @throws NotFoundException When no customer was deleted.
     */
    public function bulk_delete(array $ids)
    {
        $user_ids = Customer::where_in('id', $ids)->get()->pluck('user_id')->all();
        $is_deleted = (bool) Customer::where_in('id', $ids)->delete();

        throw_if(!$is_deleted, __('Customers could not be deleted.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        if (!function_exists('wp_delete_user')) {
            require_once ABSPATH . 'wp-admin/includes/user.php';
        }

        foreach ($user_ids as $user_id) {
            wp_delete_user($user_id);
        }

        return true;
    }

    /**
     * Delete every customer matching the filters, along with their linked WordPress users.
     *
     * Runs in a transaction that is rolled back on failure.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, date range and location filters.
     * @return bool True when at least one customer row was deleted.
     * @throws Exception When deletion fails.
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
            DB::rollback();
            throw $e;
        }
    }

    /**
     * Build the customer list query with order stats, billing address, filters and sorting applied.
     *
     * @since 1.0.0
     *
     * @param ListFilterDTO $filters Search, date range, location and sorting.
     * @return QueryBuilder
     */
    protected function list_query(ListFilterDTO $filters)
    {
        $query = Customer::query()
            ->select_raw('*, id as cid')
            ->filter_with_datetime_range($filters->from_date, $filters->to_date)
            ->with_max('orders', 'created_at')
            ->with_count('orders')
            ->with_sum(['orders' => fn($query) => $query->where('payment_status', PaymentStatus::PAID)], 'base_total')
            ->with('billing_address')
            ->when($filters->search, function (QueryBuilder $query, $search) {
                return $query->where_any(['first_name', 'last_name', 'email', 'phone'], 'like', '%' . $search . '%');
            });

        $this->apply_location_filter($query, $filters);

        return $this->apply_sorting($query, $filters);
    }

    /**
     * Narrow the list to customers whose default shipping address matches.
     *
     * A customer has many addresses, so location has to name one of them. The
     * default shipping address is the one that decides where an order goes,
     * which is what a merchant means by where a customer is.
     *
     * @since 1.0.0
     *
     * @param QueryBuilder  $query   List query to narrow.
     * @param ListFilterDTO $filters Filters carrying the optional country and city.
     * @return QueryBuilder The same query when no location is given.
     */
    protected function apply_location_filter(QueryBuilder $query, ListFilterDTO $filters)
    {
        $country = $filters->country ?? null;
        $city = $filters->city ?? null;

        if (empty($country) && empty($city)) {
            return $query;
        }

        return $query->where_has('shipping_address', function (QueryBuilder $address_query) use ($country, $city) {
            $address_query->when($country, function (QueryBuilder $address_query) use ($country) {
                return $address_query->where('country', $country);
            });

            return $address_query->when($city, function (QueryBuilder $address_query) use ($city) {
                return $address_query->where('city', $city);
            });
        });
    }

    /**
     * List the distinct locations present on customers' default shipping addresses.
     *
     * The filter controls offer only locations a merchant actually has
     * customers in, so the options come from the address rows themselves
     * rather than from a global reference list.
     *
     * @since 1.0.0
     *
     * @param string|null $country Restrict the cities to this country.
     * @return array{countries: string[], cities: string[]} Sorted country and city names.
     */
    public function list_locations($country = null)
    {
        $addresses = Address::query()
            ->where('is_default_shipping', true)
            ->get()
            ->all();

        $countries = [];
        $cities = [];

        foreach ($addresses as $address) {
            if (!empty($address->country)) {
                $countries[$address->country] = true;
            }

            if (empty($address->city)) {
                continue;
            }

            if (!empty($country) && $address->country !== $country) {
                continue;
            }

            $cities[$address->city] = true;
        }

        $countries = array_keys($countries);
        $cities = array_keys($cities);

        sort($countries);
        sort($cities);

        return [
            'countries' => $countries,
            'cities' => $cities,
        ];
    }
}
