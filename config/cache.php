<?php

/**
 * Cache configuration.
 *
 * Every key is optional. The framework resolves the same defaults shown here
 * when a key is absent, and the cache works correctly with this file deleted,
 * so it exists to document and override them.
 */

return [
    /*
     * The store used when none is named. "database" is the default because it
     * is the only store with no environment requirement: it works on every
     * host, including those where direct filesystem access is unavailable.
     *
     * Any store below can be reached explicitly with Cache::store('name').
     */
    'default' => 'database',

    /*
     * The store the rate limiter counts in. Leave this null to reuse the
     * default store above.
     *
     * Pointing the limiter somewhere of its own is useful when the default
     * store is cleared often: flushing a page cache should not hand every
     * caller a fresh allowance.
     */
    'limiter' => null,

    'stores' => [
        /*
         * Backed by the WordPress transient API.
         *
         * A site running a persistent object cache drop-in benefits from this
         * automatically: transients then bypass the database entirely and are
         * served from memory. The trade-off is that entries are no longer
         * enumerable, which is why flush() advances a namespace version rather
         * than deleting rows. The rows a flush() leaves behind are reclaimed
         * later by the schedule configured below, and only while no object
         * cache is active, since a version an object cache is serving has
         * nothing to delete until that cache evicts it.
         */
        'database' => [
            'driver' => 'database',

            /*
             * The lifetime given to entries written with forever().
             *
             * WordPress marks a transient with no expiry as an autoloaded
             * option, and skips its own autoload size guard when doing so, so
             * such a value would be read and unserialized on every request.
             * A long finite lifetime avoids that while remaining "forever" as
             * far as the cache API is concerned.
             *
             * Set this to 0 to store forever() entries with literal never
             * expiry, accepting the autoload cost.
             */
            'forever_ttl' => 10 * YEAR_IN_SECONDS,

            /*
             * When true, entries are shared by every site on a network and are
             * written as site transients. Leave false to scope entries to the
             * site that wrote them.
             */
            'network' => false,

            /*
             * How often the rows a flush() leaves behind are reclaimed, as a
             * WP-Cron schedule name. flush() itself only advances a namespace
             * version; deleting the superseded rows happens here instead, a
             * bounded number at a time, since a delete that could touch an
             * unbounded number of rows has no place inside the request that
             * called flush().
             *
             * Set to false to disable the schedule. The rows are still queued
             * on every flush(), so re-enabling this later reclaims the backlog.
             */
            'gc' => 'daily',

            /*
             * Whether cache events are dispatched for this store. Building an
             * event is skipped entirely when nothing is listening, so leaving
             * this on costs almost nothing.
             */
            'events' => true,
        ],

        /*
         * Backed by files beneath the uploads directory.
         *
         * Faster than the database store on hosts without an object cache, but
         * it needs direct filesystem access. Where WordPress would select a
         * remote transport, or cannot select one at all, this store diverts to
         * the fallback below rather than failing the request.
         */
        'file' => [
            'driver' => 'file',

            /*
             * The directory entries are written to. Null derives one beneath
             * the uploads directory, with a salted suffix so that an entry's
             * location cannot be guessed from its key alone.
             *
             * Override this only if you can guarantee the path is writable and
             * not served to the public.
             */
            'path' => null,

            /*
             * The store used when direct filesystem access is unavailable.
             */
            'fallback' => 'database',

            /*
             * How often expired entries are swept, as a WP-Cron schedule name.
             * Each run visits a bounded slice of the cache, so a large cache is
             * cleaned over several runs rather than in one long scan.
             *
             * Set to false to disable the schedule; entries are still removed
             * when a read finds them expired.
             */
            'gc' => 'daily',

            'network' => false,
            'events' => true,
        ],

        /*
         * Held in memory for the current request only.
         *
         * Honours lifetimes exactly as the persistent stores do, so a test
         * written against this store predicts production behaviour.
         */
        'array' => [
            'driver' => 'array',
            'network' => false,
            'events' => false,
        ],
    ],
];
