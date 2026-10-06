<?php

namespace Kirki\Ecommerce\App\Setup\Presets;

use Kirki\Ecommerce\Framework\Database\Query\Model;
use Kirki\Ecommerce\Framework\Supports\Facades\Log;

defined('ABSPATH') || exit;

/**
 * Inserts the preset profiles of one kind (shipping or tax) and resolves rules that refer to them.
 *
 * Profiles are matched by name, so a profile the merchant already has is
 * reused and the rules resolve its id.
 *
 * @since 1.0.0
 */
abstract class ProfilePresets
{
    /**
     * Get the profile model class this inserter writes.
     *
     * @since 1.0.0
     *
     * @return class-string<Model>
     */
    abstract protected function get_model_class();

    /**
     * Get the preset response key that lists this kind of profile.
     *
     * @since 1.0.0
     *
     * @return string
     */
    abstract protected function get_section();

    /**
     * Get the rule condition type that matches this kind of profile.
     *
     * @since 1.0.0
     *
     * @return string
     */
    abstract protected function get_condition_type();

    /**
     * Get the rule actions a preset rule on this kind of profile may use.
     *
     * @since 1.0.0
     *
     * @return string[]
     */
    abstract protected function get_allowed_actions();

    /**
     * Create each preset profile whose name does not exist yet.
     *
     * A preset marked default becomes the default only when the store has no
     * default of this kind, so a store never ends up with two.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $presets The preset response.
     * @param PresetContext        $context The store's answers.
     * @return void
     */
    public function apply(array $presets, PresetContext $context)
    {
        $model = $this->get_model_class();

        foreach ($this->get_definitions($presets) as $definition) {
            if ($model::query()->where('name', $definition['name'])->exists()) {
                continue;
            }

            $model::create([
                'name' => $definition['name'],
                'is_default' => !empty($definition['is_default']) && !$model::query()->where('is_default', true)->exists(),
            ]);

            Log::info(sprintf('Store presets created the %s profile %s', $this->get_section(), $definition['name']));
        }
    }

    /**
     * Get the stored id of every preset profile, keyed by its preset key.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $presets The preset response.
     * @return array<string, int> Profiles with no stored row are left out.
     */
    public function get_ids(array $presets)
    {
        $model = $this->get_model_class();
        $ids = [];

        foreach ($this->get_definitions($presets) as $definition) {
            $profile = $model::query()->where('name', $definition['name'])->first();

            if (!empty($profile)) {
                $ids[$definition['key']] = (int) $profile->id;
            }
        }

        return $ids;
    }

    /**
     * Turn `{profile, action}` preset rules into stored rules.
     *
     * A rule whose profile was not created, or whose action is not allowed, is
     * dropped.
     *
     * @since 1.0.0
     *
     * @param mixed              $rules The preset rules.
     * @param array<string, int> $ids   Profile ids keyed by preset key.
     * @return array<int, array<string, mixed>> Stored rules.
     */
    public function resolve_rules($rules, array $ids)
    {
        $resolved = [];

        foreach (is_array($rules) ? $rules : [] as $rule) {
            $profile_id = $ids[$rule['profile'] ?? ''] ?? null;
            $action = $rule['action']['type'] ?? null;

            if ($profile_id === null || !in_array($action, $this->get_allowed_actions(), true)) {
                Log::warning(sprintf('Store presets skipped a %s rule', $this->get_section()));
                continue;
            }

            $value = $rule['action']['value'] ?? null;

            $resolved[] = [
                'relation' => 'AND',
                'conditions' => [
                    [
                        'type' => $this->get_condition_type(),
                        'operator' => '=',
                        'value' => (string) $profile_id,
                    ],
                ],
                'action' => [
                    'type' => $action,
                    'value' => is_numeric($value) ? $value + 0 : null,
                ],
            ];
        }

        return $resolved;
    }

    /**
     * Get the valid profile definitions of the response.
     *
     * @since 1.0.0
     *
     * @param array<string, mixed> $presets The preset response.
     * @return array<int, array<string, mixed>> Definitions with key, a sanitized name and is_default.
     */
    protected function get_definitions(array $presets)
    {
        $definitions = [];

        foreach ($presets[$this->get_section()] ?? [] as $definition) {
            $name = sanitize_text_field($definition['name'] ?? '');

            if (empty($definition['key']) || $name === '') {
                continue;
            }

            $definitions[] = [
                'key' => (string) $definition['key'],
                'name' => $name,
                'is_default' => !empty($definition['is_default']),
            ];
        }

        return $definitions;
    }
}
