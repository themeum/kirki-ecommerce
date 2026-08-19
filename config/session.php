<?php

return [
    /**
     * Storage driver: "database" stores payloads in WordPress transients,
     * "array" keeps them in memory for the current request only.
     *
     * No substitution ever happens silently. An unknown name is an error.
     */
    'driver' => 'database',

    /**
     * How long a session lives, in minutes. The stored payload's expiry is
     * reset to this on every save, so an actively used session slides forward.
     */
    'lifetime' => 120,

    /**
     * When true the identifier cookie is emitted as a browser-session cookie
     * with no expiry, so it is dropped when the browser closes.
     */
    'expire_on_close' => false,

    /**
     * The name of the session identifier cookie. Defaults to the application
     * prefix followed by "session".
     */
    'cookie' => null,

    /**
     * Cookie scope. A null domain lets the browser scope it to the host.
     * "secure" defaults to whether the current request is served over TLS.
     */
    'path' => '/',
    'domain' => null,
    'secure' => null,
    'http_only' => true,
    'same_site' => 'Lax',

    /**
     * Extra field names that are never written to the session as old input.
     * Merged with the framework's own list of password, password_confirmation
     * and current_password. Uploaded files are always excluded.
     */
    'dont_flash' => [],
];
