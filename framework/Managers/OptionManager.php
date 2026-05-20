<?php

namespace Kirki\Ecommerce\Managers;

use function Kirki\Ecommerce\with_prefix;

class OptionManager
{
    /**
     * Set the value of an option.
     *
     * Stores the given value in the WordPress options table using a namespaced option name.
     *
     * @param string $name The option key to set.
     * @param mixed $value The value to store for the option.
     * @return bool True if the value was updated, false otherwise.
     */
    public function set(string $name, $value)
    {
        return update_option($this->get_option_name($name), $value);
    }

    /**
     * Retrieve the value of an option.
     *
     * Gets the value from the WordPress options table using a namespaced option name.
     * Returns the default value if the option does not exist.
     *
     * @param string $name The option key to retrieve.
     * @param mixed|null $default The default value to return if the option does not exist.
     * @return mixed The value of the option or the default value.
     */
    public function get(string $name, $default = null)
    {
        return get_option($this->get_option_name($name), $default);
    }

    /**
     * Delete an option.
     *
     * Removes the option from the WordPress options table using a namespaced option name.
     *
     * @param string $name The option key to delete.
     * @return bool True if the option was deleted, false otherwise.
     */
    public function delete(string $name)
    {
        return delete_option($this->get_option_name($name));
    }

    /**
     * Generate the full option name with namespace prefix.
     *
     * Prepends the app prefix to the given option key.
     *
     * @param string $name The base option key.
     * @return string The namespaced option key.
     */
    protected function get_option_name(string $name)
    {
        return with_prefix($name);
    }
}
