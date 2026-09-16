<?php

/**
 * Prepended to php-scoper's own PHP process (see composer.json's `scope`
 * script). Loading Composer's autoloader pulls in the framework's global
 * helpers, which expect ABSPATH to be defined.
 */

defined('ABSPATH') || define('ABSPATH', __DIR__);

error_reporting(E_ALL & ~E_DEPRECATED & ~E_USER_DEPRECATED);
