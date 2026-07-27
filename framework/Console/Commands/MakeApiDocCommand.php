<?php

namespace Kirki\Ecommerce\Console\Commands;

use Kirki\Ecommerce\Console\CommandBase;
use Kirki\Ecommerce\Console\Synopsis;
use Kirki\Ecommerce\OpenApi\RuleParser;
use Kirki\Ecommerce\OpenApi\SchemaGenerator;
use Kirki\Ecommerce\Route;
use Kirki\Ecommerce\Supports\Facades\File;
use Kirki\Ecommerce\Supports\Str;
use ReflectionClass;
use ReflectionMethod;
use ReflectionNamedType;

use function Kirki\Ecommerce\app_path;
use function Kirki\Ecommerce\base_path;

/**
 * Scaffold OpenAPI path documentation for an API controller.
 *
 * @since 1.0.0
 */
class MakeApiDocCommand extends CommandBase
{
    /**
     * Positional arguments.
     *
     * @var array
     * @since 1.0.0
     */
    protected $args;

    /**
     * Associative options.
     *
     * @var array
     * @since 1.0.0
     */
    protected $assoc;

    /**
     * Rule parser instance.
     *
     * @var RuleParser
     * @since 1.0.0
     */
    protected $rule_parser;

    /**
     * Tag mapping by controller keyword.
     *
     * @var array
     * @since 1.0.0
     */
    protected $tag_map = [
        'Tag' => 'Catalog',
        'Brand' => 'Catalog',
        'Category' => 'Catalog',
        'Collection' => 'Catalog',
        'Attribute' => 'Catalog',
        'AttributeValue' => 'Catalog',
        'Product' => 'Catalog',
        'Variant' => 'Catalog',
        'ProductSchema' => 'Catalog',
        'Customer' => 'Customers',
        'Currency' => 'Pricing',
        'CurrencyExchange' => 'Pricing',
        'Coupon' => 'Pricing',
        'TaxProfile' => 'Pricing',
        'ShippingBox' => 'Shipping',
        'ShippingProfile' => 'Shipping',
        'Country' => 'Shipping',
        'Cart' => 'Cart',
        'Order' => 'Orders',
        'Page' => 'Content',
        'Settings' => 'Settings',
        'AppConfig' => 'Settings',
        'Onboarding' => 'Settings',
        'PaymentGateway' => 'Payments',
        'ManualPaymentMethod' => 'Payments',
        'Webhook' => 'Webhooks',
        'SiteProduct' => 'Storefront',
    ];

    /**
     * Initialize the command.
     *
     * @return void
     * @since 1.0.0
     */
    public function __construct()
    {
        parent::__construct();
        $this->rule_parser = new RuleParser();
    }

    /**
     * Run the command.
     *
     * @param array $args Positional arguments.
     * @param array $assoc Associative options.
     *
     * @return void
     * @since 1.0.0
     */
    public function run($args, $assoc)
    {
        $this->args = $args;
        $this->assoc = $assoc;

        $controller_input = Str::pascal($args[0]);
        $controller_class = $this->resolve_controller($controller_input);

        if (!$controller_class) {
            \WP_CLI::error(sprintf('Controller [%s] not found.', $controller_input));
        }

        $this->ensure_routes_loaded();

        $routes = $this->routes_for_controller($controller_class);

        if (empty($routes)) {
            \WP_CLI::error(sprintf('No routes found for [%s].', $controller_class));
        }

        (new SchemaGenerator())->generate_all();

        $short = (new ReflectionClass($controller_class))->getShortName();
        $base_name = preg_replace('/Controller$/', '', $short);
        $paths_class = $base_name . 'Paths';
        $output_file = app_path('OpenApi/Paths/' . $paths_class . '.php');

        if (File::exists($output_file) && empty($assoc['force'])) {
            \WP_CLI::error(sprintf('Path file already exists: %s (use --force to overwrite)', $output_file));
        }

        $operations = $this->build_operations($routes, $controller_class, $base_name);
        $content = $this->populate_stub([
            'class_name' => $paths_class,
            'namespace' => 'Kirki\\Ecommerce\\App\\OpenApi\\Paths',
            'operations' => $operations,
        ]);

        File::put($output_file, $content);

        \WP_CLI::success(sprintf('OpenAPI paths scaffolded at [%s].', $output_file));
        \WP_CLI::line('Review the file, then run: wp kirki docs:generate');
    }

    /**
     * Validate command arguments.
     *
     * @param array $args Positional arguments.
     * @param array $assoc Associative options.
     *
     * @return bool
     * @since 1.0.0
     */
    protected function passed($args, $assoc)
    {
        return !empty($args[0]);
    }

    /**
     * Resolve a controller class name from user input.
     *
     * @param string $input Controller name.
     *
     * @return string|null
     * @since 1.0.0
     */
    protected function resolve_controller($input)
    {
        $candidates = [
            'Kirki\\Ecommerce\\App\\Http\\Controllers\\Api\\' . $input,
            'Kirki\\Ecommerce\\App\\Http\\Controllers\\Api\\' . $input . 'Controller',
            'Kirki\\Ecommerce\\App\\Http\\Controllers\\Site\\' . $input,
            'Kirki\\Ecommerce\\App\\Http\\Controllers\\Site\\' . $input . 'Controller',
            'Kirki\\Ecommerce\\App\\Payment\\' . $input,
            'Kirki\\Ecommerce\\App\\Payment\\' . $input . 'Controller',
        ];

        foreach ($candidates as $class) {
            if (class_exists($class)) {
                return $class;
            }
        }

        return null;
    }

    /**
     * Ensure routes/api.php has been loaded so Route::get_routes() is populated.
     *
     * @return void
     * @since 1.0.0
     */
    protected function ensure_routes_loaded()
    {
        if (!empty(Route::get_routes())) {
            return;
        }

        $routes_file = base_path('routes/api.php');

        if (File::exists($routes_file)) {
            require $routes_file;
        }
    }

    /**
     * Collect routes handled by the given controller.
     *
     * @param string $controller_class Controller FQCN.
     *
     * @return array
     * @since 1.0.0
     */
    protected function routes_for_controller($controller_class)
    {
        $matched = [];

        foreach (Route::get_routes() as $route) {
            $action = $route->get_action();

            if (!is_array($action) || ($action[0] ?? null) !== $controller_class) {
                continue;
            }

            $endpoint = $route->get_endpoint();

            if (in_array($endpoint, ['/test', '/test-public'], true)) {
                continue;
            }

            if (strpos($endpoint, '/payment-gateways/download') === 0) {
                continue;
            }

            $matched[] = $route;
        }

        return $matched;
    }

    /**
     * Build @OA operation annotation blocks for matched routes.
     *
     * @param array  $routes Route instances.
     * @param string $controller_class Controller FQCN.
     * @param string $base_name Controller base name without Controller suffix.
     *
     * @return string
     * @since 1.0.0
     */
    protected function build_operations(array $routes, $controller_class, $base_name)
    {
        $tag = $this->tag_map[$base_name] ?? 'Catalog';
        $blocks = [];
        $reflection = new ReflectionClass($controller_class);

        foreach ($routes as $route) {
            $action = $route->get_action();
            $method_name = $action[1];
            $http = strtoupper($route->get_method());
            $path = $route->get_endpoint();
            $oa_method = $this->oa_method($http);
            $operation_id = Str::snake($base_name) . '_' . $method_name;
            $summary = ucfirst(str_replace('_', ' ', $method_name)) . ' ' . $base_name;

            $path_params = $this->path_parameters($path);
            $request_body = '';
            $query_params = '';

            if ($reflection->hasMethod($method_name)) {
                $method = $reflection->getMethod($method_name);
                $request_class = $this->request_type_hint($method);

                if ($request_class && method_exists($request_class, 'rules')) {
                    if (in_array($http, ['POST', 'PUT', 'PATCH'], true)) {
                        $request_body = $this->request_body_block($request_class, $base_name, $method_name);
                    } else {
                        $query_params = $this->query_params_block($request_class);
                    }
                }
            }

            if (in_array($method_name, ['get', 'index'], true) && empty($query_params)) {
                $query_params = $this->list_filter_query_params();
            }

            $response_schema = $this->guess_response_schema($base_name, $method_name);
            $security = !empty($route->get_middlewares())
                ? " *     security={{\"wpCookieAuth\": {}}},\n"
                : '';

            $block = " * @OA\\{$oa_method}(\n";
            $block .= " *     path=\"{$path}\",\n";
            $block .= " *     tags={\"{$tag}\"},\n";
            $block .= " *     summary=\"{$summary}\",\n";
            $block .= " *     operationId=\"{$operation_id}\",\n";
            $block .= $security;
            $block .= $path_params;
            $block .= $query_params;
            $block .= $request_body;
            $block .= " *     @OA\\Response(\n";
            $block .= " *         response=200,\n";
            $block .= " *         description=\"Successful response\",\n";
            $block .= " *         @OA\\JsonContent(\n";
            $block .= " *             type=\"object\",\n";
            $block .= " *             @OA\\Property(property=\"data\", ref=\"#/components/schemas/{$response_schema}\"),\n";
            $block .= " *             @OA\\Property(property=\"message\", type=\"string\")\n";
            $block .= " *         )\n";
            $block .= " *     ),\n";
            $block .= " *     @OA\\Response(response=401, description=\"Unauthorized\", @OA\\JsonContent(ref=\"#/components/schemas/ErrorResponse\")),\n";
            $block .= " *     @OA\\Response(response=422, description=\"Validation error\", @OA\\JsonContent(ref=\"#/components/schemas/ErrorResponse\"))\n";
            $block .= ' * )';

            $blocks[] = $block;
        }

        return implode("\n *\n", $blocks);
    }

    /**
     * Map HTTP method to OpenAPI annotation class name.
     *
     * @param string $http HTTP method.
     *
     * @return string
     * @since 1.0.0
     */
    protected function oa_method($http)
    {
        $map = [
            'GET' => 'Get',
            'POST' => 'Post',
            'PUT' => 'Put',
            'PATCH' => 'Patch',
            'DELETE' => 'Delete',
        ];

        return $map[$http] ?? 'Get';
    }

    /**
     * Build path parameter annotations.
     *
     * @param string $path Route path.
     *
     * @return string
     * @since 1.0.0
     */
    protected function path_parameters($path)
    {
        preg_match_all('/\{(\w+)\}/', $path, $matches);
        $out = '';

        foreach ($matches[1] as $param) {
            $type = (substr($param, -2) === 'id' || $param === 'id') ? 'integer' : 'string';
            $out .= " *     @OA\\Parameter(name=\"{$param}\", in=\"path\", required=true, @OA\\Schema(type=\"{$type}\")),\n";
        }

        return $out;
    }

    /**
     * Resolve the first Request type-hint on a controller method.
     *
     * @param ReflectionMethod $method Method reflection.
     *
     * @return string|null
     * @since 1.0.0
     */
    protected function request_type_hint(ReflectionMethod $method)
    {
        foreach ($method->getParameters() as $parameter) {
            $type = $parameter->getType();

            if (!$type instanceof ReflectionNamedType || $type->isBuiltin()) {
                continue;
            }

            $name = $type->getName();

            if (is_subclass_of($name, 'Kirki\\Ecommerce\\Http\\Request') || $name === 'Kirki\\Ecommerce\\Http\\Request') {
                return $name;
            }

            if (strpos($name, 'Request') !== false) {
                return $name;
            }
        }

        return null;
    }

    /**
     * Build a request body annotation block from a Request class.
     *
     * @param string $request_class Request FQCN.
     * @param string $base_name Controller base name.
     * @param string $method_name Controller method name.
     *
     * @return string
     * @since 1.0.0
     */
    protected function request_body_block($request_class, $base_name, $method_name)
    {
        $fields = $this->rule_parser->parse($request_class);
        $schema_ref = $this->guess_request_schema($base_name, $method_name, $request_class);

        if ($schema_ref) {
            return " *     @OA\\RequestBody(\n"
                . " *         required=true,\n"
                . " *         @OA\\JsonContent(ref=\"#/components/schemas/{$schema_ref}\")\n"
                . " *     ),\n";
        }

        if (empty($fields)) {
            return '';
        }

        $required = $this->rule_parser->required_fields($fields);
        $props = $this->rule_parser->to_property_annotations($fields);
        $required_attr = !empty($required)
            ? 'required={"' . implode('","', $required) . '"},'
            : '';

        return " *     @OA\\RequestBody(\n"
            . " *         required=true,\n"
            . " *         @OA\\JsonContent(\n"
            . " *             type=\"object\",\n"
            . " *             {$required_attr}\n"
            . implode("\n", $props) . "\n"
            . " *         )\n"
            . " *     ),\n";
    }

    /**
     * Build query parameter annotations from a Request class.
     *
     * @param string $request_class Request FQCN.
     *
     * @return string
     * @since 1.0.0
     */
    protected function query_params_block($request_class)
    {
        $fields = $this->rule_parser->parse($request_class);
        $out = '';

        foreach ($fields as $name => $meta) {
            $required = $meta['required'] ? 'true' : 'false';
            $out .= " *     @OA\\Parameter(name=\"{$name}\", in=\"query\", required={$required}, @OA\\Schema(type=\"{$meta['type']}\")),\n";
        }

        return $out;
    }

    /**
     * Default list filter query parameters.
     *
     * @return string
     * @since 1.0.0
     */
    protected function list_filter_query_params()
    {
        return " *     @OA\\Parameter(name=\"search\", in=\"query\", @OA\\Schema(type=\"string\")),\n"
            . " *     @OA\\Parameter(name=\"page\", in=\"query\", @OA\\Schema(type=\"integer\", default=1)),\n"
            . " *     @OA\\Parameter(name=\"limit\", in=\"query\", @OA\\Schema(type=\"integer\", default=10)),\n"
            . " *     @OA\\Parameter(name=\"sort_by\", in=\"query\", @OA\\Schema(type=\"string\", default=\"id\")),\n"
            . " *     @OA\\Parameter(name=\"sort_order\", in=\"query\", @OA\\Schema(type=\"string\", enum={\"asc\",\"desc\"}, default=\"desc\")),\n";
    }

    /**
     * Guess the response schema component name.
     *
     * @param string $base_name Controller base name.
     * @param string $method_name Method name.
     *
     * @return string
     * @since 1.0.0
     */
    protected function guess_response_schema($base_name, $method_name)
    {
        if (in_array($method_name, ['get', 'index'], true)) {
            $list = $base_name . 'ListResource';
            $single = $base_name . 'Resource';

            if (class_exists('Kirki\\Ecommerce\\App\\Resources\\' . $base_name . '\\' . $list)
                || class_exists('Kirki\\Ecommerce\\App\\Resources\\' . $list)
            ) {
                return $list;
            }

            return $single;
        }

        if ($method_name === 'bulk_actions' || $method_name === 'delete') {
            return 'object';
        }

        return $base_name . 'Resource';
    }

    /**
     * Guess a request body schema from DTO naming conventions.
     *
     * @param string $base_name Controller base name.
     * @param string $method_name Method name.
     * @param string $request_class Request FQCN.
     *
     * @return string|null
     * @since 1.0.0
     */
    protected function guess_request_schema($base_name, $method_name, $request_class)
    {
        if (strpos($request_class, 'BulkAction') !== false) {
            return 'BulkActionRequest';
        }

        $candidates = [];

        if (in_array($method_name, ['create', 'store'], true)) {
            $candidates[] = 'Create' . $base_name . 'DTO';
            $candidates[] = 'Create' . $base_name . 'PayloadDTO';
        }

        if (in_array($method_name, ['update'], true)) {
            $candidates[] = 'Update' . $base_name . 'DTO';
            $candidates[] = 'Update' . $base_name . 'PayloadDTO';
        }

        foreach ($candidates as $name) {
            $path = app_path('OpenApi/Schemas/Generated/' . $name . '.php');

            if (File::exists($path)) {
                return $name;
            }
        }

        return null;
    }

    /**
     * Populate the OpenAPI paths stub.
     *
     * @param array $data Stub data.
     *
     * @return string
     * @since 1.0.0
     */
    protected function populate_stub(array $data)
    {
        $stub_path = $this->stub_path() . '/openapi-paths.stub';

        if (File::missing($stub_path)) {
            \WP_CLI::error('Stub not found: ' . $stub_path);
        }

        return Str::replace(
            ['{{class_name}}', '{{namespace}}', '{{operations}}'],
            [$data['class_name'], $data['namespace'], $data['operations']],
            File::get($stub_path)
        );
    }

    /**
     * Prepare command metadata.
     *
     * @return void
     * @since 1.0.0
     */
    protected function prepare()
    {
        $this->summary('Scaffold OpenAPI path documentation for an API controller')
            ->description("## EXAMPLES \n\n wp kirki make:api-doc TagController\n\n wp kirki make:api-doc TagController --force")
            ->synopsis(
                Synopsis::type('positional')
                    ->name('name')
                    ->description('The controller name')
            )->synopsis(
                Synopsis::type('flag')
                    ->name('force')
                    ->description('Overwrite existing path file')
                    ->optional()
            );
    }
}
