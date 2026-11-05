<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\JsonSchema\JsonSchema;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\DTO\Customer\CustomerListFilterDTO;
use Kirki\Ecommerce\App\Mcp\Concerns\MasksPersonalData;
use Kirki\Ecommerce\App\Mcp\Concerns\PagesResults;
use Kirki\Ecommerce\App\Models\Address;
use Kirki\Ecommerce\App\Models\Customer;
use Kirki\Ecommerce\App\Services\CustomerService;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;

/**
 * Finds customers with their order count, total spent and last order date. Personal data is masked.
 *
 * @since 1.0.0
 */
class FindCustomersTool extends StoreReadTool
{
    use MasksPersonalData;
    use PagesResults;

    const SORT_COLUMNS = ['created_at', 'orders_count', 'base_amount_spent', 'last_order_date'];

    const SORT_ORDERS = ['asc', 'desc'];

    /** @var string */
    protected $description = 'Find customers of the store with the filters of the admin customer list. '
        . 'Use it for questions such as "who are my best customers?" (sort_by base_amount_spent) or "which customers live in Germany?" (country DE). '
        . 'Each customer has the ID, the masked email, the first name, the country of the default shipping address, the order count, the total spent on paid orders in the store currency, the last order date and the marketing consent. '
        . 'A search by a full email still matches. Phone numbers and addresses are not returned.';

    /** @var CustomerService */
    protected $customer_service;

    /**
     * Create the tool with the customer service.
     *
     * @since 1.0.0
     *
     * @param CustomerService $customer_service Service of the admin customer list.
     */
    public function __construct(CustomerService $customer_service)
    {
        $this->customer_service = $customer_service;
    }

    /**
     * @inheritDoc
     *
     * @since 1.0.0
     */
    public function input_schema(JsonSchema $schema)
    {
        return array_merge([
            'search' => $schema->string()
                ->description('Part of a name, an email or a phone number. A full email also matches.'),
            'country' => $schema->string()
                ->pattern('^[A-Za-z]{2}$')
                ->description('ISO 3166-1 alpha-2 country code of the default shipping address, for example "DE".'),
            'city' => $schema->string()
                ->description('City of the default shipping address.'),
            'sort_by' => $schema->string()
                ->enum(static::SORT_COLUMNS)
                ->default('created_at')
                ->description('Sort by creation date, order count, total spent or last order date.'),
            'sort_order' => $schema->string()
                ->enum(static::SORT_ORDERS)
                ->default('desc')
                ->description('Sort direction.'),
        ], $this->page_schema($schema));
    }

    /**
     * Find the customers that match the arguments.
     *
     * @since 1.0.0
     *
     * @param Request $request Tool arguments.
     *
     * @return Response
     * @throws ValidationException When an argument is not valid.
     */
    public function handle(Request $request)
    {
        $country_message = __('Enter "country" as an ISO 3166-1 alpha-2 code, for example "DE".', 'kirki-ecommerce');
        /* translators: %s: argument name. */
        $text_message = __('The "%s" must be text of at most 100 characters.', 'kirki-ecommerce');

        $params = $this->validate_arguments($request->all(), array_merge([
            'search' => 'nullable|string|max:100',
            'country' => 'nullable|string|regex:/^[A-Za-z]{2}$/',
            'city' => 'nullable|string|max:100',
            'sort_by' => 'nullable|string|in:' . implode(',', static::SORT_COLUMNS),
            'sort_order' => 'nullable|string|in:' . implode(',', static::SORT_ORDERS),
        ], $this->page_rules()), array_merge([
            'search.string' => sprintf($text_message, 'search'),
            'search.max' => sprintf($text_message, 'search'),
            'country.string' => $country_message,
            'country.regex' => $country_message,
            'city.string' => sprintf($text_message, 'city'),
            'city.max' => sprintf($text_message, 'city'),
            'sort_by.in' => $this->one_of_message('sort_by', static::SORT_COLUMNS),
            'sort_order.in' => $this->one_of_message('sort_order', static::SORT_ORDERS),
        ], $this->page_messages()));
        [$page, $per_page] = $this->page_arguments($params);

        $customers = $this->customer_service->paginated(CustomerListFilterDTO::from_array([
            'search' => $params['search'] ?? null,
            'country' => empty($params['country']) ? null : strtoupper($params['country']),
            'city' => $params['city'] ?? null,
            'sort_by' => $params['sort_by'] ?? 'created_at',
            'sort_order' => $params['sort_order'] ?? 'desc',
            'page' => $page,
            'limit' => $per_page,
        ]));
        $rows = $customers->items()->all();
        $countries = $this->shipping_countries(array_map(fn($customer) => (int) $customer->id, $rows));

        return Response::structured([
            'customers' => array_values(array_map(function (Customer $customer) use ($countries) {
                return $this->customer_row($customer, $countries[(int) $customer->id] ?? null);
            }, $rows)),
            'pagination' => $this->pagination($customers),
        ]);
    }

    /**
     * Get the country of the default shipping address of each customer.
     *
     * @since 1.0.0
     *
     * @param int[] $customer_ids Customer IDs.
     *
     * @return array<int, string> Country codes keyed by customer ID.
     */
    protected function shipping_countries(array $customer_ids)
    {
        if (empty($customer_ids)) {
            return [];
        }

        $countries = [];
        $addresses = Address::query()
            ->where_in('customer_id', $customer_ids)
            ->where('is_default_shipping', true)
            ->get(['customer_id', 'country'])
            ->all();

        foreach ($addresses as $address) {
            $countries[(int) $address->customer_id] = $address->country;
        }

        return $countries;
    }

    /**
     * Shape one customer into a compact row with masked personal data.
     *
     * @since 1.0.0
     *
     * @param Customer    $customer Customer with the order stats of the list.
     * @param string|null $country  Country of the default shipping address.
     *
     * @return array<string, mixed>
     */
    protected function customer_row(Customer $customer, $country)
    {
        return [
            'customer_id' => (int) $customer->id,
            'first_name' => $this->first_name($customer->first_name),
            'email' => $this->mask_email($customer->email),
            'country' => $country,
            'orders_count' => (int) $customer->orders_count,
            'base_amount_spent' => $this->money((int) $customer->orders_sum_base_total),
            'last_order_date' => $this->datetime($customer->orders_max_created_at),
            'accepts_marketing' => (bool) $customer->accepts_marketing,
            'created_at' => $this->datetime($customer->created_at),
        ];
    }
}
