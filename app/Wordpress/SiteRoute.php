<?php

namespace Kirki\Ecommerce\App\Wordpress;

/**
 * SiteRoute
 *
 * A fluent router for WordPress, built on top of WordPress'
 * native rewrite rules / query vars system. Requires PHP 7.4+.
 *
 * Each plugin/theme creates its OWN instance with its own namespace, so
 * multiple plugins using SiteRoute never collide on query vars or route IDs:
 */
class SiteRoute
{
    /** Route dispatched via WP's 'template_redirect' hook (default). */
    public const HOOK_TEMPLATE_REDIRECT = 'template_redirect';

    /** Route dispatched via WP's 'template_include' filter. */
    public const HOOK_TEMPLATE_INCLUDE = 'template_include';

    /** Routing method: real WP rewrite rules, registered on 'init'. */
    public const ROUTING_REWRITE_RULES = 'rewrite_rules';

    /** Routing method: match the request path directly on 'parse_request'. */
    public const ROUTING_PARSE_REQUEST = 'parse_request';

    /** Match a route against the current request path (default). */
    public const MATCH_PATH = 'path';

    /** Match a route against an existing WordPress Page via is_page(). */
    public const MATCH_PAGE = 'page';

    /**
     * Predefined param types => regex fragment (without capturing parens).
     * Used both to build the matching regex and to pick a sanitizer.
     */
    protected const TYPES = [
        'any'   => '[^/]+',
        'int'   => '\d+',
        'alpha' => '[a-zA-Z]+',
        'alnum' => '[a-zA-Z0-9]+',
        'slug'  => '[a-zA-Z0-9-]+',
    ];

    /**
     * Sanitizer function applied to a matched param's value, keyed by type.
     * Falls back to sanitize_text_field() for unknown/custom types.
     */
    protected const SANITIZERS = [
        'int'   => 'absint',
        'alpha' => 'sanitize_text_field',
        'alnum' => 'sanitize_text_field',
        'slug'  => 'sanitize_title',
        'any'   => 'sanitize_text_field',
    ];

    /**
     * Short name identifying this instance, e.g. 'my_plugin'. Prefixes all
     * query vars and route IDs so multiple plugins using SiteRoute never
     * collide with each other.
     */
    protected string $namespace;

    /**
     * How routes are matched against the current request. One of
     * self::ROUTING_REWRITE_RULES (default) or self::ROUTING_PARSE_REQUEST.
     */
    protected string $routing_method = self::ROUTING_REWRITE_RULES;

    /**
     * The WordPress hook new routes are dispatched on, unless a route
     * overrides it with hook(). One of self::HOOK_TEMPLATE_REDIRECT or
     * self::HOOK_TEMPLATE_INCLUDE.
     */
    protected string $default_hook_name = self::HOOK_TEMPLATE_REDIRECT;

    /**
     * All routes registered on this instance, keyed by an internal route id.
     * Each entry is an associative array describing the route (method, URL
     * segments, param constraints, callback, middleware, etc).
     *
     * @var array<string, array>
     */
    protected array $routes = [];

    /**
     * Maps a route name (set via name()) to its internal route id, so
     * url() can look routes up by name.
     *
     * @var array<string, string>
     */
    protected array $names = [];

    /**
     * The route id most recently added. Fluent methods like where(),
     * middleware(), name(), hook(), match_using()... all apply to
     * whichever route this currently points at.
     */
    protected ?string $last_route_id = null;

    /**
     * Tracks which "hook_name:priority" combinations already have a
     * WordPress action/filter registered, so the same combination is
     * never hooked twice.
     *
     * @var array<string, bool>
     */
    protected array $registered_hooks = [];

    /**
     * Whether boot() has already run for this instance (registers the
     * routing-method-specific matching hooks: init/query_vars for
     * ROUTING_REWRITE_RULES, or parse_request for ROUTING_PARSE_REQUEST).
     */
    protected bool $hooked = false;

    /**
     * Request-scoped context for whichever route is currently dispatching:
     * its name, its sanitized params, plus any ad-hoc data a callback
     * stashes via set_route_data(). Static (class-level) because only one
     * route ever dispatches per request — this lets template files and
     * any other code reach it without a reference to the SiteRoute
     * instance, via SiteRoute::is() / route_param() / route_params() /
     * route_data().
     *
     * @var array{name: ?string, params: array, data: array}
     */
    protected static array $current = ['name' => null, 'params' => [], 'data' => []];

    /**
     * The most recently constructed SiteRoute instance. The entire fluent
     * builder API (get(), post(), where(), middleware()...) is declared
     * static and operates on this instance, which is what makes it
     * callable both as SiteRoute::get(...) and $route->get(...) — PHP
     * allows calling a static method through -> transparently. Register
     * one instance's routes fully before constructing another elsewhere.
     */
    protected static ?self $instance = null;

    /**
     * @param string $namespace Unique short name for your plugin/theme.
     *                          Sanitized via sanitize_key(); falls back to
     *                          'siteroute' if empty after sanitizing.
     *                          Becomes the active instance for the static
     *                          builder API.
     */
    public function __construct(string $namespace)
    {
        $safe = sanitize_key($namespace);
        $this->namespace = $safe !== '' ? $safe : 'siteroute';
        self::$instance = $this;
    }

    // ------------------------------------------------------------------
    // Static builder API — operates on the current instance (see $instance)
    // ------------------------------------------------------------------

    /**
     * Set the default WordPress hook used to dispatch routes added from
     * this point onward. Call before registering routes; individual routes
     * can still override it afterwards with hook().
     *
     * @param string $hook self::HOOK_TEMPLATE_REDIRECT or self::HOOK_TEMPLATE_INCLUDE.
     */
    public static function set_default_hook(string $hook): self
    {
        return self::instance()->do_set_default_hook($hook);
    }

    /**
     * Choose how requests are matched to routes. Call before registering
     * any routes.
     *
     * @param string $method self::ROUTING_REWRITE_RULES (default) or self::ROUTING_PARSE_REQUEST.
     */
    public static function set_routing_method(string $method): self
    {
        return self::instance()->do_set_routing_method($method);
    }

    /**
     * Register a route that matches HTTP GET requests.
     *
     * @param string $uri      Laravel-style path, e.g. 'products/{id:int}'.
     *                         When paired with ->match_using(self::MATCH_PAGE),
     *                         this is instead a WordPress Page ID or slug.
     * @param mixed  $callback Closure, function name, invokable class-string,
     *                         "Class::method" string, or [Class::class, 'method'].
     */
    public static function get(string $uri, $callback = null): self
    {
        return self::instance()->add('GET', $uri, $callback);
    }

    /** Register a route that matches HTTP POST requests. See get() for params. */
    public static function post(string $uri, $callback = null): self
    {
        return self::instance()->add('POST', $uri, $callback);
    }

    /** Register a route that matches HTTP PUT requests. See get() for params. */
    public static function put(string $uri, $callback = null): self
    {
        return self::instance()->add('PUT', $uri, $callback);
    }

    /** Register a route that matches HTTP PATCH requests. See get() for params. */
    public static function patch(string $uri, $callback = null): self
    {
        return self::instance()->add('PATCH', $uri, $callback);
    }

    /** Register a route that matches HTTP DELETE requests. See get() for params. */
    public static function delete(string $uri, $callback = null): self
    {
        return self::instance()->add('DELETE', $uri, $callback);
    }

    /** Register a route that matches any HTTP method. See get() for params. */
    public static function any(string $uri, $callback = null): self
    {
        return self::instance()->add('ANY', $uri, $callback);
    }

    /**
     * Constrain one or more params on the most recently added route.
     * Only meaningful for ->match_using(self::MATCH_PATH) routes (the
     * default) — a self::MATCH_PAGE route's "path" is a page ID/slug, not
     * a param-bearing URI.
     *
     * Single param:    where('id', 'int')
     * Multiple params: where(['id' => 'int', 'slug' => 'slug'])
     *
     * The rule can be:
     *   - a type keyword ('int', 'alpha', 'alnum', 'slug')
     *   - a raw regex fragment, e.g. '[A-Z0-9]{6}'
     *   - a callable(mixed $value): bool for a runtime check (doesn't
     *     affect the match regex itself — the route 404s if it returns false)
     *
     * @param string|array $param Param name, or ['param' => rule, ...].
     * @param mixed        $rule  Rule (ignored when $param is an array).
     */
    public static function where($param, $rule = null): self
    {
        return self::instance()->do_where($param, $rule);
    }

    /**
     * Add a guard to the most recently added route, run before its
     * callback/template/redirect. Chainable — call multiple times to add
     * several guards, run in the order added.
     *
     * @param callable $middleware Receives the route's sanitized params
     *                             array and must return:
     *                               - true (or any truthy value) to continue
     *                               - false to abort with 403 Forbidden
     *                               - a WP_Error to abort with its message
     */
    public static function middleware(callable $middleware): self
    {
        return self::instance()->do_middleware($middleware);
    }

    /**
     * Name the most recently added route so a URL for it can be rebuilt
     * later with url(), and so is() can identify it once dispatched.
     */
    public static function name(string $name): self
    {
        return self::instance()->do_name($name);
    }

    /**
     * Build an absolute URL for a named route. For a self::MATCH_PAGE
     * route this resolves the page's real permalink; for a self::MATCH_PATH
     * route it's built from the route's literal segments and $params.
     *
     * @param string $name   Name previously set via name().
     * @param array  $params Values to fill a self::MATCH_PATH route's {params} with.
     */
    public static function url(string $name, array $params = []): string
    {
        return self::instance()->do_url($name, $params);
    }

    /**
     * Instead of running a callback, include this template file for the
     * most recently added route (looked up via locate_template() first, so
     * themes can override it, falling back to an absolute path).
     */
    public static function template(string $path): self
    {
        return self::instance()->do_template($path);
    }

    /**
     * Instead of running a callback, redirect for the most recently added
     * route. The URL may contain {param} placeholders substituted with the
     * route's sanitized param values.
     */
    public static function redirect(string $url, int $status = 302): self
    {
        return self::instance()->do_redirect($url, $status);
    }

    /**
     * Attach extra data to the most recently added route, merged into its
     * params/context wherever params are made available (callback args,
     * template extract(), route_data(), redirect placeholders). Route
     * params win if a key collides with one set here.
     */
    public static function with(array $data): self
    {
        return self::instance()->do_with($data);
    }

    /**
     * Choose which WordPress hook dispatches the most recently added route,
     * and at what priority.
     *
     *   - self::HOOK_TEMPLATE_REDIRECT (default): fast short-circuit. Once
     *     matched, SiteRoute runs the redirect/template/callback itself
     *     and exits. Callback signature: function ($params).
     *
     *   - self::HOOK_TEMPLATE_INCLUDE: defers to WP's own template loading.
     *     WP finishes its normal query/template flow, then (if no
     *     template() was set) the route's callback is called as
     *     function ($params, $template) and its return value MUST be the
     *     template file path to use.
     *
     * @param string $hook_name self::HOOK_TEMPLATE_REDIRECT or self::HOOK_TEMPLATE_INCLUDE.
     * @param int    $priority  WordPress hook priority (lower runs earlier).
     */
    public static function hook(string $hook_name, int $priority = 10): self
    {
        return self::instance()->do_hook($hook_name, $priority);
    }

    /**
     * Choose how the most recently added route is matched against the
     * current request.
     *
     *   - self::MATCH_PATH (default): the route's URI is matched against
     *     the current request path, same as always.
     *
     *   - self::MATCH_PAGE: the route's "path" is instead a WordPress Page
     *     ID or slug, and the route matches whenever is_page() is true for
     *     it — i.e. whatever URL that Page actually has. No rewrite rule /
     *     path pattern is registered for it at all.
     *
     * @param string $type self::MATCH_PATH or self::MATCH_PAGE.
     */
    public static function match_using(string $type): self
    {
        return self::instance()->do_match_using($type);
    }

    /**
     * Force a rewrite rule flush. Only meaningful for the
     * ROUTING_REWRITE_RULES method. Call from an activation hook only —
     * never on a normal request, it's expensive.
     */
    public static function flush(): void
    {
        self::instance()->do_flush();
    }

    // ------------------------------------------------------------------
    // Static request-context accessors — read the currently dispatching route
    // ------------------------------------------------------------------

    /**
     * Stash a piece of ad-hoc data against the currently dispatching
     * route. Call this from inside a route callback:
     *
     *      SiteRoute::get('products/{slug}', function ($params) {
     *          SiteRoute::set_route_data('page_title', 'Shop');
     *          SiteRoute::set_route_data('product', get_product($params['slug']));
     *          return __DIR__ . '/single.php';
     *      })->hook(SiteRoute::HOOK_TEMPLATE_INCLUDE);
     *
     * Then, in the template file (or anywhere else in the request):
     *
     *      $title   = SiteRoute::route_data('page_title');
     *      $product = SiteRoute::route_data('product');
     *      $slug    = SiteRoute::route_param('slug');
     */
    public static function set_route_data(string $key, $value): void
    {
        self::$current['data'][$key] = $value;
    }

    /**
     * Get a single param from the currently dispatching route (e.g. the
     * {slug} in 'products/{slug}'). Returns $default if there's no
     * dispatching route or the param doesn't exist.
     */
    public static function route_param(string $key, $default = null)
    {
        return self::$current['params'][$key] ?? $default;
    }

    /**
     * Get all params for the currently dispatching route. Returns $default
     * if there's no dispatching route (or it has no params).
     */
    public static function route_params($default = [])
    {
        return !empty(self::$current['params']) ? self::$current['params'] : $default;
    }

    /**
     * Get a value previously stored with set_route_data() during the
     * current route's callback. Returns $default if it was never set.
     */
    public static function route_data(string $key, $default = null)
    {
        return self::$current['data'][$key] ?? $default;
    }

    /**
     * Whether the currently dispatching route is the one named $name
     * (set via name()). Always false if no route is dispatching, or the
     * dispatching route was never named.
     */
    public static function is(string $name): bool
    {
        return self::$current['name'] !== null && self::$current['name'] === $name;
    }

    // ------------------------------------------------------------------
    // Instance implementations behind the static builder API
    // ------------------------------------------------------------------

    /**
     * Returns the "current" instance the static builder API operates on.
     *
     * @throws \RuntimeException If no SiteRoute has been constructed yet.
     */
    protected static function instance(): self
    {
        if (self::$instance === null) {
            throw new \RuntimeException(
                'SiteRoute: construct one first, e.g. new SiteRoute(\'my_plugin\'), before calling its route methods.'
            );
        }
        return self::$instance;
    }

    /** Instance implementation behind set_default_hook(). */
    protected function do_set_default_hook(string $hook): self
    {
        $this->default_hook_name = $this->normalize_hook_name($hook);
        return $this;
    }

    /** Instance implementation behind set_routing_method(). */
    protected function do_set_routing_method(string $method): self
    {
        $this->routing_method = $method === self::ROUTING_PARSE_REQUEST
            ? self::ROUTING_PARSE_REQUEST
            : self::ROUTING_REWRITE_RULES;
        return $this;
    }

    /**
     * Shared implementation behind get()/post()/put()/patch()/delete()/any().
     * Compiles the URI, stores the route definition, and ensures its
     * default dispatch hook is registered.
     *
     * @param mixed $callback Anything resolve_callback() understands.
     */
    protected function add(string $method, string $uri, $callback): self
    {
        $this->boot();

        $segments = $this->parse_segments($uri);
        $param_types = [];
        foreach ($segments as $segment) {
            if ($segment['type'] === 'param' && $segment['inline_type'] !== null) {
                $param_types[$segment['name']] = $segment['inline_type'];
            }
        }

        $id = $this->namespace . '_' . substr(md5($method . '|' . $uri), 0, 12);

        $this->routes[$id] = [
            'method'           => $method,
            'raw_path'         => $uri,
            'match_using'      => self::MATCH_PATH,
            'segments'         => $segments,
            'param_types'      => $param_types,
            'param_validators' => [],
            'callback'         => $callback,
            'middleware'       => [],
            'template'         => null,
            'redirect'         => null,
            'name'             => null,
            'with'             => [],
            'hook_name'        => $this->default_hook_name,
            'hook_priority'    => 10,
        ];

        $this->last_route_id = $id;

        $this->ensure_hook_registered($this->default_hook_name, 10);

        return $this;
    }

    /** Instance implementation behind where(). */
    protected function do_where($param, $rule = null): self
    {
        if (is_array($param)) {
            foreach ($param as $name => $param_rule) {
                $this->do_where($name, $param_rule);
            }
            return $this;
        }

        if ($this->last_route_id === null) {
            return $this;
        }

        $route = &$this->routes[$this->last_route_id];

        if (is_callable($rule)) {
            $route['param_validators'][$param] = $rule;
        } else {
            $route['param_types'][$param] = (string) $rule;
        }

        return $this;
    }

    /** Instance implementation behind middleware(). */
    protected function do_middleware(callable $middleware): self
    {
        if ($this->last_route_id !== null) {
            $this->routes[$this->last_route_id]['middleware'][] = $middleware;
        }
        return $this;
    }

    /** Instance implementation behind name(). */
    protected function do_name(string $name): self
    {
        if ($this->last_route_id !== null) {
            $this->routes[$this->last_route_id]['name'] = $name;
            $this->names[$name] = $this->last_route_id;
        }
        return $this;
    }

    /** Instance implementation behind url(). */
    protected function do_url(string $name, array $params = []): string
    {
        if (!isset($this->names[$name])) {
            return '';
        }

        $route = $this->routes[$this->names[$name]];

        if ($route['match_using'] === self::MATCH_PAGE) {
            $page_id = $this->resolve_page_id($route['raw_path']);
            return $page_id ? (string) get_permalink($page_id) : '';
        }

        $pieces = [];
        foreach ($route['segments'] as $segment) {
            if ($segment['type'] === 'literal') {
                $pieces[] = $segment['value'];
            } else {
                $value = $params[$segment['name']] ?? ('{' . $segment['name'] . '}');
                $pieces[] = rawurlencode((string) $value);
            }
        }

        return esc_url(home_url('/' . implode('/', $pieces)));
    }

    /** Instance implementation behind template(). */
    protected function do_template(string $path): self
    {
        if ($this->last_route_id !== null) {
            $this->routes[$this->last_route_id]['template'] = $path;
        }
        return $this;
    }

    /** Instance implementation behind redirect(). */
    protected function do_redirect(string $url, int $status = 302): self
    {
        if ($this->last_route_id !== null) {
            $this->routes[$this->last_route_id]['redirect'] = ['url' => $url, 'status' => $status];
        }
        return $this;
    }

    /** Instance implementation behind with(). */
    protected function do_with(array $data): self
    {
        if ($this->last_route_id !== null) {
            $this->routes[$this->last_route_id]['with'] = array_merge(
                $this->routes[$this->last_route_id]['with'],
                $data
            );
        }
        return $this;
    }

    /** Instance implementation behind hook(). */
    protected function do_hook(string $hook_name, int $priority = 10): self
    {
        if ($this->last_route_id === null) {
            return $this;
        }

        $hook_name = $this->normalize_hook_name($hook_name);

        $this->routes[$this->last_route_id]['hook_name'] = $hook_name;
        $this->routes[$this->last_route_id]['hook_priority'] = $priority;

        $this->ensure_hook_registered($hook_name, $priority);

        return $this;
    }

    /** Instance implementation behind match_using(). */
    protected function do_match_using(string $type): self
    {
        if ($this->last_route_id !== null) {
            $this->routes[$this->last_route_id]['match_using'] = $type === self::MATCH_PAGE
                ? self::MATCH_PAGE
                : self::MATCH_PATH;
        }
        return $this;
    }

    /** Instance implementation behind flush(). */
    protected function do_flush(): void
    {
        $this->boot();

        if ($this->routing_method === self::ROUTING_REWRITE_RULES) {
            $this->register_rewrite_rules();
            flush_rewrite_rules();
        }
    }

    // ------------------------------------------------------------------
    // Internals
    // ------------------------------------------------------------------

    /**
     * Parse a Laravel-style URI ('orders/{id}') into an ordered list of
     * segments — each either a literal string or a param descriptor.
     * Inline types are supported: {id:int}. Not meaningful for
     * self::MATCH_PAGE routes, but harmless to compute regardless.
     */
    protected function parse_segments(string $uri): array
    {
        $parts = explode('/', trim($uri, '/'));
        $segments = [];

        foreach ($parts as $part) {
            if ($part === '') {
                continue;
            }

            if (preg_match('/^\{(\w+)(?::(.+))?\}$/', $part, $m)) {
                $segments[] = [
                    'type'        => 'param',
                    'name'        => $m[1],
                    'inline_type' => $m[2] ?? null,
                ];
            } else {
                $segments[] = ['type' => 'literal', 'value' => $part];
            }
        }

        return $segments;
    }

    /**
     * Build the final matching regex + ordered param name list for a
     * self::MATCH_PATH route, using its current param_types (which
     * where() may have changed since the route was added). Literal
     * segments are preg_quote'd so route text can never break out of the
     * intended regex.
     *
     * @return array{0:string,1:string[]}
     */
    protected function build_pattern(array $route): array
    {
        $compiled = [];
        $param_names = [];

        foreach ($route['segments'] as $segment) {
            if ($segment['type'] === 'literal') {
                $compiled[] = preg_quote($segment['value'], '#');
                continue;
            }

            $name = $segment['name'];
            $type = $route['param_types'][$name] ?? 'any';
            $regex_fragment = self::TYPES[$type] ?? $type; // known type, or raw custom regex

            $param_names[] = $name;
            $compiled[] = '(' . $regex_fragment . ')';
        }

        $pattern = '^' . implode('/', $compiled) . '/?$';

        return [$pattern, $param_names];
    }

    /**
     * Registers the routing-method-specific hooks that make request
     * matching work (rewrite rules + query vars, or parse_request
     * interception). Runs only once per instance, on the first route added.
     */
    protected function boot(): void
    {
        if ($this->hooked) {
            return;
        }
        $this->hooked = true;

        if ($this->routing_method === self::ROUTING_PARSE_REQUEST) {
            add_action('parse_request', [$this, 'intercept_parse_request']);
        } else {
            add_action('init', [$this, 'register_rewrite_rules']);
            add_filter('query_vars', [$this, 'register_query_vars']);
        }
    }

    /**
     * Makes sure a WordPress action/filter is hooked for the given
     * dispatch hook name + priority combination. Safe to call repeatedly —
     * each combination is only ever registered once. The registered
     * closure simply delegates to handle_template_redirect()/
     * handle_template_include(), which independently re-check whether a
     * matched route actually belongs to this exact hook + priority.
     */
    protected function ensure_hook_registered(string $hook_name, int $priority): void
    {
        $key = $hook_name . ':' . $priority;
        if (isset($this->registered_hooks[$key])) {
            return;
        }
        $this->registered_hooks[$key] = true;

        if ($hook_name === self::HOOK_TEMPLATE_INCLUDE) {
            add_filter(self::HOOK_TEMPLATE_INCLUDE, function ($template) use ($priority) {
                return $this->handle_template_include($template, $priority);
            }, $priority);
        } else {
            add_action(self::HOOK_TEMPLATE_REDIRECT, function () use ($priority) {
                $this->handle_template_redirect($priority);
            }, $priority);
        }
    }

    /**
     * Hooked to 'init' for the ROUTING_REWRITE_RULES method. Registers a
     * WP rewrite rule per self::MATCH_PATH route. self::MATCH_PAGE routes
     * are skipped entirely — they're matched with is_page() instead, not a
     * URL pattern.
     */
    public function register_rewrite_rules(): void
    {
        foreach ($this->routes as $id => $route) {
            if ($route['match_using'] === self::MATCH_PAGE) {
                continue;
            }

            [$pattern, $param_names] = $this->build_pattern($route);

            $query = 'index.php?' . $this->namespace . '_route=' . $id;
            foreach ($param_names as $i => $name) {
                $query .= '&' . $this->query_var_name($name) . '=$matches[' . ($i + 1) . ']';
            }

            add_rewrite_rule($pattern, $query, 'top');
        }
    }

    /** Hooked to 'query_vars' for the ROUTING_REWRITE_RULES method. Whitelists this instance's query vars. */
    public function register_query_vars(array $vars): array
    {
        $vars[] = $this->namespace . '_route';

        foreach ($this->routes as $route) {
            if ($route['match_using'] === self::MATCH_PAGE) {
                continue;
            }
            foreach ($route['segments'] as $segment) {
                if ($segment['type'] === 'param') {
                    $vars[] = $this->query_var_name($segment['name']);
                }
            }
        }

        return $vars;
    }

    /**
     * Hooked to 'parse_request' for the ROUTING_PARSE_REQUEST method. This
     * fires AFTER WordPress has already tried to match the request against
     * its own rewrite rules — deliberately so, because WordPress's own
     * bookkeeping from that step ($wp->did_permalink, $wp->matched_rule)
     * is what its later 404 logic relies on to avoid false 404s.
     *
     * Only self::MATCH_PATH routes are considered here — self::MATCH_PAGE
     * routes are matched later, with is_page(), once the query has run.
     *
     * If a route matches here, we replace $wp->query_vars outright with
     * just this route's vars — discarding whatever WP's generic
     * %postname% rule guessed (e.g. an unrelated existing post/page that
     * happens to share the route's slug) — and disable redirect_canonical,
     * which would otherwise redirect the visitor to that unrelated post.
     *
     * @param \WP $wp The main WP request object, passed by reference by WordPress.
     */
    public function intercept_parse_request($wp): void
    {
        $path = isset($wp->request) && $wp->request !== ''
            ? trim((string) $wp->request, '/')
            : $this->resolve_request_path();

        foreach ($this->routes as $id => $route) {
            if ($route['match_using'] === self::MATCH_PAGE) {
                continue;
            }

            [$pattern, $param_names] = $this->build_pattern($route);

            if (!preg_match('#' . $pattern . '#', $path, $matches)) {
                continue;
            }

            $query_vars = [$this->namespace . '_route' => $id];
            foreach ($param_names as $i => $name) {
                $query_vars[$this->query_var_name($name)] = $matches[$i + 1] ?? '';
            }

            // Replace outright rather than merge, so nothing WP's own
            // generic matching guessed (e.g. an unrelated post's 'name')
            // can cause the main query to resolve to the wrong content.
            $wp->query_vars = $query_vars;

            // Whatever WP matched no longer applies — don't let it redirect
            // the visitor to some unrelated post/page's canonical URL.
            add_filter('redirect_canonical', '__return_false');

            return; // first match wins
        }
    }

    /**
     * Resolve the current request's path relative to the site's home path
     * (so subdirectory installs work correctly), with no leading/trailing
     * slashes. Used by the ROUTING_PARSE_REQUEST method as a fallback for
     * when $wp->request isn't populated.
     */
    protected function resolve_request_path(): string
    {
        $request_uri = isset($_SERVER['REQUEST_URI']) ? (string) $_SERVER['REQUEST_URI'] : '';
        $path = (string) parse_url($request_uri, PHP_URL_PATH);

        $home_path = (string) parse_url(home_url(), PHP_URL_PATH);
        if ($home_path !== '' && $home_path !== '/' && strpos($path, $home_path) === 0) {
            $path = substr($path, strlen($home_path));
        }

        return trim($path, '/');
    }

    /**
     * Resolves a stored route callback into something call_user_func() can
     * invoke. Supports:
     *   - a Closure or already-callable array/string, returned as-is
     *   - "Class::method" strings — instantiated, then that method called
     *   - a bare invokable class-string, e.g. PageController::class —
     *     instantiated and used directly (relies on its __invoke())
     *   - [SomeClass::class, 'method'] — instantiated, then that method called
     *   - a plain function name string
     *
     * @param mixed $action
     * @return mixed A callable, or null if $action was null.
     */
    protected function resolve_callback($action)
    {
        if ($action === null) {
            return null;
        }

        try {
            if (is_string($action)) {
                if (strpos($action, '::') !== false) {
                    [$class, $method] = explode('::', $action, 2);
                    return class_exists($class) ? [new $class(), $method] : $action;
                }

                if (class_exists($action)) {
                    // Bare invokable class-string, e.g. PageController::class
                    return new $action();
                }

                return $action; // plain function name
            }

            if (is_array($action) && isset($action[0], $action[1]) && is_string($action[0]) && class_exists($action[0])) {
                return [new $action[0](), $action[1]];
            }
        } catch (\Throwable $e) {
            $this->fail(500, 'SiteRoute: unable to resolve route callback.');
        }

        return $action; // Closure, [object, method], etc.
    }

    /**
     * Finds the route matching the current request that is due to be
     * dispatched on the given hook name + priority — checking
     * self::MATCH_PATH routes (via the query var set by rewrite
     * rules/parse_request interception) first, then falling back to
     * self::MATCH_PAGE routes (via is_page()). Runs the method check,
     * builds sanitized params, then where() validators and middleware()
     * guards, and populates the static request context (self::$current)
     * so is()/route_param()/route_data() work from within the callback and
     * template file. Returns null if nothing matched here — either no
     * route matched at all, or the matched route belongs to a different
     * hook/priority (some other registered callback will handle it).
     *
     * @return array{route:array,params:array}|null
     */
    protected function match_current_request(string $expected_hook_name, int $expected_priority): ?array
    {
        $route = $this->find_matching_path_route($expected_hook_name, $expected_priority);

        if ($route === null) {
            $route = $this->find_matching_page_route($expected_hook_name, $expected_priority);
        }

        if ($route === null) {
            return null;
        }

        // 1. Method check
        $method = strtoupper($_SERVER['REQUEST_METHOD'] ?? 'GET');
        if ($route['method'] !== 'ANY' && $method !== $route['method']) {
            $this->fail(405, 'Method Not Allowed');
        }

        // 2. Build sanitized/typed params — never hand raw request data onward
        $params = [];
        foreach ($route['segments'] as $segment) {
            if ($segment['type'] !== 'param') {
                continue;
            }
            $name = $segment['name'];
            $raw = get_query_var($this->query_var_name($name));
            $raw = is_string($raw) ? wp_unslash($raw) : $raw;

            $type = $route['param_types'][$name] ?? 'any';
            $sanitizer = self::SANITIZERS[$type] ?? 'sanitize_text_field';
            $params[$name] = $sanitizer($raw);
        }

        // 3. Custom where() validators — a false result means "not a real match"
        foreach ($route['param_validators'] as $name => $validator) {
            if (!call_user_func($validator, $params[$name] ?? null)) {
                $this->fail(404, 'Not Found');
            }
        }

        // 4. Merge in any with() extra data — route params win on key collisions
        $params = array_merge($route['with'], $params);

        // For self::MATCH_PAGE routes, always expose which page this is.
        if ($route['match_using'] === self::MATCH_PAGE) {
            $params['page_id'] = $this->resolve_page_id($route['raw_path']);
            $params['current_page_id'] = get_queried_object_id();
        }

        // Make params/name reachable from anywhere (callback body, template
        // file) via the static accessors, before middleware/callback run.
        self::$current['name'] = $route['name'];
        self::$current['params'] = $params;
        self::$current['data'] = [];

        // 5. Middleware chain
        foreach ($route['middleware'] as $mw) {
            $result = call_user_func($mw, $params);

            if ($result === false) {
                $this->fail(403, 'Forbidden');
            }
            if ($result instanceof \WP_Error) {
                $this->fail(403, $result->get_error_message());
            }
        }

        return ['route' => $route, 'params' => $params];
    }

    /**
     * Looks for a self::MATCH_PATH route matching the current request,
     * via the query var set earlier by the rewrite-rules/parse_request
     * matching mechanism.
     */
    protected function find_matching_path_route(string $expected_hook_name, int $expected_priority): ?array
    {
        $id = get_query_var($this->namespace . '_route');

        if (empty($id) || !isset($this->routes[$id])) {
            return null;
        }

        $route = $this->routes[$id];

        if ($route['match_using'] !== self::MATCH_PATH) {
            return null;
        }

        if ($route['hook_name'] !== $expected_hook_name || $route['hook_priority'] !== $expected_priority) {
            return null;
        }

        return $route;
    }

    /**
     * Looks for a self::MATCH_PAGE route matching the current request.
     * A match requires ALL of:
     *   - not the WordPress admin area
     *   - the request is for a single page (is_page())
     *   - the currently queried page's ID matches the route's registered
     *     page ID/slug (resolved to an ID either way)
     */
    protected function find_matching_page_route(string $expected_hook_name, int $expected_priority): ?array
    {
        if (is_admin()) {
            return null;
        }

        if (!is_page()) {
            return null;
        }

        $current_page_id = get_queried_object_id();

        foreach ($this->routes as $route) {
            if ($route['match_using'] !== self::MATCH_PAGE) {
                continue;
            }
            if ($route['hook_name'] !== $expected_hook_name || $route['hook_priority'] !== $expected_priority) {
                continue;
            }
            if ($this->resolve_page_id($route['raw_path']) === $current_page_id) {
                return $route;
            }
        }

        return null;
    }

    /**
     * Resolves a self::MATCH_PAGE route's raw_path (a page ID or slug,
     * matching is_page()'s own accepted input) to a definite page ID.
     * Returns 0 if it can't be resolved to an existing page.
     */
    protected function resolve_page_id($page_ref): int
    {
        if (is_numeric($page_ref)) {
            return (int) $page_ref;
        }

        $page = get_page_by_path((string) $page_ref);
        return $page ? $page->ID : 0;
    }

    /**
     * Runs for routes dispatched via the HOOK_TEMPLATE_REDIRECT hook:
     * handles the redirect / template / callback, then exits. Bound at the
     * given priority so only routes registered at that same priority are
     * matched.
     */
    protected function handle_template_redirect(int $priority): void
    {
        $match = $this->match_current_request(self::HOOK_TEMPLATE_REDIRECT, $priority);
        if ($match === null) {
            return;
        }

        $route = $match['route'];
        $params = $match['params'];

        status_header(200);
        nocache_headers();

        if ($route['redirect'] !== null) {
            $url = preg_replace_callback('/\{(\w+)\}/', function ($m) use ($params) {
                return isset($params[$m[1]]) ? rawurlencode((string) $params[$m[1]]) : $m[0];
            }, $route['redirect']['url']);

            wp_safe_redirect($url, $route['redirect']['status']);
            exit;
        }

        if ($route['template'] !== null) {
            $located = locate_template($route['template']);
            $file = $located !== '' ? $located : $route['template'];

            if (!file_exists($file)) {
                $this->fail(500, 'Template not found: ' . $route['template']);
            }

            extract($params, EXTR_SKIP);
            include $file;
            exit;
        }

        $callback = $this->resolve_callback($route['callback']);
        if ($callback !== null) {
            if (!is_callable($callback)) {
                $this->fail(500, 'SiteRoute: route callback is not callable.');
            }
            $response = call_user_func($callback, $params);
            if (is_string($response)) {
                echo $response; // callback is responsible for escaping any dynamic output
            }
        }

        exit;
    }

    /**
     * Runs for routes dispatched via the HOOK_TEMPLATE_INCLUDE filter.
     * Bound at the given priority so only routes registered at that same
     * priority are matched. If the route used template(), that file is
     * returned directly. Otherwise the route's callback is called as
     * callback($params, $template) and its return value is used as the
     * template — it MUST be a non-empty, existing file path.
     */
    protected function handle_template_include(string $template, int $priority): string
    {
        $match = $this->match_current_request(self::HOOK_TEMPLATE_INCLUDE, $priority);
        if ($match === null) {
            return $template;
        }

        $route = $match['route'];
        $params = $match['params'];

        if ($route['redirect'] !== null) {
            $url = preg_replace_callback('/\{(\w+)\}/', function ($m) use ($params) {
                return isset($params[$m[1]]) ? rawurlencode((string) $params[$m[1]]) : $m[0];
            }, $route['redirect']['url']);

            wp_safe_redirect($url, $route['redirect']['status']);
            exit;
        }

        if ($route['template'] !== null) {
            $located = locate_template($route['template']);
            $file = $located !== '' ? $located : $route['template'];

            if (!file_exists($file)) {
                $this->fail(500, 'Template not found: ' . $route['template']);
            }

            return $file;
        }

        $callback = $this->resolve_callback($route['callback']);
        if ($callback === null || !is_callable($callback)) {
            $this->fail(500, 'SiteRoute: template_include route has no valid callback.');
        }

        $result = call_user_func($callback, $params, $template);

        // A template_include route's callback must return a file path.
        if (!is_string($result) || $result === '' || !file_exists($result)) {
            $this->fail(500, 'SiteRoute: template_include route callback must return a valid template file path.');
        }

        return $result;
    }

    /** Namespaced query var name for a given param. */
    protected function query_var_name(string $name): string
    {
        return $this->namespace . '_p_' . $name;
    }

    /**
     * Validates a hook name against the known HOOK_* constants, falling
     * back to HOOK_TEMPLATE_REDIRECT for anything unrecognized.
     */
    protected function normalize_hook_name(string $hook_name): string
    {
        return $hook_name === self::HOOK_TEMPLATE_INCLUDE
            ? self::HOOK_TEMPLATE_INCLUDE
            : self::HOOK_TEMPLATE_REDIRECT;
    }

    /** Stops the request with a WordPress error page at the given HTTP status. */
    protected function fail(int $status, string $message): void
    {
        status_header($status);
        nocache_headers();
        wp_die(esc_html($message), esc_html($message), ['response' => $status]);
    }
}
