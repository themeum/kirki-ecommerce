<?php

/**
 * Finalises `composer scope`.
 *
 * Composer installs each scoped package at `vendor/<vendor>/<name>` (for
 * example `vendor/themeum/framework`), but the plugin runs it from
 * `vendor/libraries/<dir>` with its namespaces rewritten. The packages are
 * listed in `$packages` below; for each one this script owns both halves of
 * that:
 *
 *   1. Relocation - move the freshly installed package to
 *      `vendor/libraries/<dir>` and repoint `install-path` in
 *      `vendor/composer/installed.json` so Composer's autoloader resolves the
 *      package's PSR-4 map to the new directory. This must run *before*
 *      anything loads `vendor/autoload.php` - both the root `autoload.files`
 *      entries and the package's own already name paths that a fresh install
 *      has just invalidated - so `composer scope` runs it, then dumps the
 *      autoloader, before invoking php-scoper.
 *   2. Scoping - php-scoper cannot write into the directory it reads from
 *      (`--force` deletes the output directory before the finder runs, which
 *      would destroy the source), so scoping writes to a staging directory and
 *      this script swaps it into place and strips files the plugin does not
 *      ship.
 *
 * The framework's own `files` autoload is removed rather than kept: Composer
 * emits dependency `files` entries *before* the root package's, so the
 * framework's helpers.php (which starts `defined('ABSPATH') || exit;`) would
 * load before bootstrap/abspath.php and silently exit every CLI process. The
 * root composer.json lists the same two files in the correct position instead.
 *
 * Usage:
 *   php bin/scope-framework.php --relocate  relocate + metadata
 *   php bin/scope-framework.php             relocate + swap + strip + metadata
 *   php bin/scope-framework.php --restore   undo what a --no-scripts install did
 *
 * The `--restore` mode exists for bin/make-package.sh. Composer decides whether
 * a package is installed by looking at the path it derives from the package
 * name, not at the `install-path` recorded in installed.json, so every install
 * re-clones an unscoped copy at `vendor/<vendor>/<name>` - and the autoload
 * generator registers any package directory that exists. With scripts enabled
 * the scope run below relocates that copy away again; `--no-scripts` leaves it,
 * so `--restore` removes it and re-applies the metadata the install reset.
 */

declare(strict_types=1);

$root = dirname(__DIR__);

$installed_json = $root . '/vendor/composer/installed.json';

$scoped_namespace = 'Kirki\\Ecommerce\\';

/*
 * The packages to relocate and scope. Each `staging` directory must match the
 * `--output-dir` of that package's php-scoper pass in composer.json, and each
 * `sentinel` is a file the scoped src/ must contain before it replaces the
 * installed one.
 *
 * `stubs` names a directory under src/ whose .stub templates php-scoper copies
 * without rewriting; the package's own bin script prefixes them before the
 * bin directory is stripped. That script is also exposed as a proxy in
 * vendor/bin, which points at the unrelocated path, so the proxy is removed.
 */
$packages = [
    [
        'name' => 'themeum/framework',
        'dir' => 'framework',
        'staging' => 'vendor/.scoper-staging',
        'sentinel' => 'helpers.php',
        'namespace' => 'Framework\\',
    ],
    [
        'name' => 'ahamed/framework-mcp',
        'dir' => 'framework-mcp',
        'staging' => 'vendor/.scoper-staging-framework-mcp',
        'sentinel' => 'McpServiceProvider.php',
        'namespace' => 'Ahamed\\FrameworkMcp\\',
        'stubs' => [
            'dir' => 'Console/stubs',
            'bin' => 'bin/framework-mcp-prefix-stubs',
            'proxy' => 'vendor/bin/framework-mcp-prefix-stubs',
        ],
    ],
];

// Everything else in a package is its own tooling: tests, docs, docker
// config, build configs. Only src/ is autoloaded; LICENSE is kept because the
// plugin redistributes the dependency, composer.json because Composer reads it
// when regenerating metadata.
$keep = ['src', 'LICENSE', 'composer.json'];

$flags = array_slice($argv, 1);
$relocate_only = in_array('--relocate', $flags, true);
$restore = in_array('--restore', $flags, true);

function fail(string $message): void
{
    fwrite(STDERR, "scope-framework: $message\n");
    exit(1);
}

function remove_path(string $path): void
{
    if (is_link($path) || is_file($path)) {
        unlink($path);
        return;
    }

    if (!is_dir($path)) {
        return;
    }

    $entries = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($path, FilesystemIterator::SKIP_DOTS),
        RecursiveIteratorIterator::CHILD_FIRST
    );

    foreach ($entries as $entry) {
        $entry->isDir() && !$entry->isLink() ? rmdir($entry->getPathname()) : unlink($entry->getPathname());
    }

    rmdir($path);
}

/**
 * Move the installed package to the directory the plugin loads it from.
 *
 * Idempotent: a no-op once the package already sits at the target. When both
 * directories exist, Composer has just reinstalled the package and the target
 * holds a stale scoped copy, so the target is discarded.
 *
 * @return string one of: relocated, already-relocated
 */
function relocate_package(string $installed_dir, string $package_dir): string
{
    if (!is_dir($installed_dir)) {
        if (!is_dir($package_dir)) {
            fail("neither $installed_dir nor $package_dir exists - run composer install first.");
        }

        return 'already-relocated';
    }

    // A leftover from the previous scoping run; Composer has reinstalled since.
    remove_path($package_dir);

    if (!is_dir(dirname($package_dir)) && !mkdir(dirname($package_dir), 0777, true) && !is_dir(dirname($package_dir))) {
        fail('could not create ' . dirname($package_dir) . '.');
    }

    if (!rename($installed_dir, $package_dir)) {
        fail("could not move $installed_dir to $package_dir.");
    }

    // Composer recreates the vendor directory on the next install; leaving it
    // empty makes it look like the package is still installed there.
    @rmdir(dirname($installed_dir));

    return 'relocated';
}

/**
 * @return string one of: rewritten, already-rewritten, not-found
 */
function rewrite_installed_metadata(
    string $installed_json,
    string $package_name,
    string $from,
    string $to,
    string $install_path
): string {
    if (!is_file($installed_json)) {
        fail("$installed_json not found - run composer install first.");
    }

    $data = json_decode(file_get_contents($installed_json), true);

    if (!is_array($data) || !isset($data['packages'])) {
        fail('could not parse installed.json.');
    }

    $found = false;
    $rewritten = false;

    foreach ($data['packages'] as $index => $package) {
        if (($package['name'] ?? null) !== $package_name) {
            continue;
        }

        $found = true;

        if (($package['install-path'] ?? null) !== $install_path) {
            $data['packages'][$index]['install-path'] = $install_path;
            $rewritten = true;
        }

        if (isset($package['autoload']['psr-4'][$from])) {
            $psr4 = $package['autoload']['psr-4'];
            $psr4[$to] = $psr4[$from];
            unset($psr4[$from]);

            $data['packages'][$index]['autoload']['psr-4'] = $psr4;
            $rewritten = true;
        }

        // Dependency `files` entries are emitted before the root package's, so
        // leaving these in place loads the framework helpers - and their
        // `defined('ABSPATH') || exit;` guard - before bootstrap/abspath.php.
        if (isset($package['autoload']['files'])) {
            unset($data['packages'][$index]['autoload']['files']);
            $rewritten = true;
        }
    }

    if (!$found) {
        return 'not-found';
    }

    if (!$rewritten) {
        return 'already-rewritten';
    }

    file_put_contents(
        $installed_json,
        json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) . "\n"
    );

    return 'rewritten';
}

foreach ($packages as $package) {
    // Where Composer puts the package, and where the plugin actually runs it from.
    $installed_dir = $root . '/vendor/' . $package['name'];
    $package_dir = $root . '/vendor/libraries/' . $package['dir'];
    $install_path = '../libraries/' . $package['dir'];

    $src_dir = $package_dir . '/src';
    $staging_dir = $root . '/' . $package['staging'];
    $sentinel = $package['sentinel'];

    if ($restore) {
        // Guarded: only discard the reinstalled copy once the scoped one is
        // proven present, so a --restore run that follows a failed scope does
        // not leave the build without the package at all.
        if (!is_file($src_dir . '/' . $sentinel)) {
            fail("no scoped package at $src_dir - refusing to remove $installed_dir.");
        }

        if (is_dir($installed_dir)) {
            remove_path($installed_dir);
            @rmdir(dirname($installed_dir));
            echo "scope-framework: removed the reinstalled unscoped copy at $installed_dir\n";
        }
    } elseif (relocate_package($installed_dir, $package_dir) === 'relocated') {
        echo "scope-framework: relocated the installed package to $package_dir\n";
    }

    if (isset($package['stubs'])) {
        remove_path($root . '/' . $package['stubs']['proxy']);
        remove_path($root . '/' . $package['stubs']['proxy'] . '.bat');
    }

    if (!$relocate_only && !$restore) {
        // (a) The staged output must exist and be non-empty before anything is
        //     deleted. A failed scoping run then leaves the package untouched
        //     rather than leaving no package at all.
        if (!is_dir($staging_dir)) {
            fail("staging directory $staging_dir not found - did php-scoper run?");
        }

        $staged_files = iterator_to_array(
            new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($staging_dir, FilesystemIterator::SKIP_DOTS)
            )
        );

        if (count($staged_files) === 0) {
            remove_path($staging_dir);
            fail('staging directory is empty - refusing to replace the installed package.');
        }

        if (!is_file($staging_dir . '/' . $sentinel)) {
            remove_path($staging_dir);
            fail("staged output is missing $sentinel - refusing to replace the installed package.");
        }

        // (b) and (c) - only now is it safe to swap.
        remove_path($src_dir);

        if (!rename($staging_dir, $src_dir)) {
            fail("could not move $staging_dir to $src_dir.");
        }

        echo "scope-framework: swapped scoped source into $src_dir\n";

        if (isset($package['stubs'])) {
            $command = escapeshellarg(PHP_BINARY) . ' '
                . escapeshellarg($package_dir . '/' . $package['stubs']['bin']) . ' '
                . escapeshellarg($src_dir . '/' . $package['stubs']['dir']) . ' '
                . escapeshellarg(rtrim($scoped_namespace, '\\'));

            passthru($command, $exit_code);

            if ($exit_code !== 0) {
                fail("could not prefix the stub templates of {$package['name']}.");
            }
        }

        // Strip the package's own tooling.
        $stripped = 0;

        foreach (scandir($package_dir) as $entry) {
            if ($entry === '.' || $entry === '..' || in_array($entry, $keep, true)) {
                continue;
            }

            remove_path($package_dir . '/' . $entry);
            $stripped++;
        }

        echo "scope-framework: stripped $stripped non-runtime path(s) from the package\n";
    }

    $scoped_prefix = $scoped_namespace . $package['namespace'];

    switch (rewrite_installed_metadata($installed_json, $package['name'], $package['namespace'], $scoped_prefix, $install_path)) {
        case 'rewritten':
            echo "scope-framework: rewrote {$package['name']} metadata - prefix $scoped_prefix, install-path $install_path\n";
            break;
        case 'already-rewritten':
            echo "scope-framework: {$package['name']} metadata already rewritten, nothing to do\n";
            break;
        default:
            fail("no entry for {$package['name']} found in installed.json.");
    }
}
