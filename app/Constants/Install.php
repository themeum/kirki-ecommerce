<?php

namespace Kirki\Ecommerce\App\Constants;

final class Install
{
    /**
     * Option holding the plugin version the installer last provisioned for.
     *
     * Kept out of OptionKeys because that class doubles as the allow-list for
     * the settings endpoint, and every constant in it is treated as a
     * resolvable settings section.
     */
    const INSTALLED_VERSION = 'installed_version';
}
