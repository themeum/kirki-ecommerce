<?php

namespace Kirki\Ecommerce\Discovery;

use Kirki\Ecommerce\Contracts\Cacheable;
use Kirki\Ecommerce\Contracts\Discoverable;

use function Kirki\Ecommerce\app;
use function Kirki\Ecommerce\app_path;
use function Kirki\Ecommerce\config_path;

class PolicyDiscovery implements Discoverable, Cacheable
{
    /**
     * The discovered policies array.
     *
     * @var array
     */
    protected array $policies = [];

    /**
     * Discover the policies from the file system.
     *
     * @return self
     */
    public function discover()
    {
        // For the production mode we will cache the policies to improve the performance.
        // So don't need to discover the policies from the filesystem.
        if (!app()->is_dev_mode()) {
            return $this;
        }

        $policies_directory = app_path('Policies');

        if (!file_exists($policies_directory)) {
            return $this;
        }

        $policy_files = glob($policies_directory . '/*.php');

        if (empty($policy_files)) {
            return $this;
        }

        foreach ($policy_files as $policy_file) {
            $policy_name = $this->filename($policy_file);

            if (!$this->is_valid_policy_name($policy_name)) {
                continue;
            }

            $policy = $this->policy_class($policy_name);
            $model = $this->associated_model($policy_name);

            $this->add_policy($model, $policy);
        }

        return $this;
    }

    /**
     * Get the filename of the policy.
     *
     * @param string $path
     * @return string
     */
    protected function filename(string $path)
    {
        return basename($path, '.php');
    }

    /**
     * Add a policy to the policies array.
     *
     * @param string $model
     * @param string $policy
     * @return void
     */
    protected function add_policy(string $model, string $policy)
    {
        $this->policies[] = compact('model', 'policy');
    }

    /**
     * Get the policies array.
     *
     * @return array
     */
    public function policies()
    {
        return $this->policies;
    }

    /**
     * Get the policy class from the policy name.
     *
     * @param string $policy_name
     * @return string
     */
    protected function policy_class(string $policy_name)
    {
        $policy_base_namespace = 'Ecommerce\\App\\Policies\\';

        return $policy_base_namespace . $policy_name;
    }

    /**
     * Get the model class from the policy name.
     *
     * @param string $policy_name
     * @return string
     */
    protected function associated_model(string $policy_name)
    {
        $model_base_namespace = 'Ecommerce\\App\\Models\\';
        $model_name = str_replace('Policy', '', $policy_name);

        return $model_base_namespace . $model_name;
    }

    /**
     * Check if the policy name is valid.
     *
     * @param string $policy_name
     * @return bool
     */
    protected function is_valid_policy_name(string $policy_name)
    {
        if (!str_ends_with($policy_name, 'Policy')) {
            return false;
        }

        $model_class = $this->associated_model($policy_name);

        if (!class_exists($model_class)) {
            return false;
        }

        return true;
    }

    /**
     * Cache the policies.
     *
     * @param string|null $path
     * @return $this
     */
    public function cache(?string $path = null)
    {
        // We only cache the policies in the development mode.
        // For the production mode we will use the cached policies.
        if (!app()->is_dev_mode()) {
            return $this;
        }

        $path = $path ?? config_path('policies.cache.php');

        if (!file_exists(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        file_put_contents($path, '<?php return ' . var_export($this->policies(), true) . ';');

        return $this;
    }
}
