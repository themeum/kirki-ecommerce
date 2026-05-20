<?php

namespace Kirki\Ecommerce\Database\Query;

use Closure;
use Kirki\Ecommerce\Collections\Collection;
use Kirki\Ecommerce\Database\Query\Relations\Relation;

/**
 * Eager load one or more relations for a set of models.
 *
 * Accept an array of models and a list of relation method names, then
 * fetch and match related records in as few queries as possible. This
 * reduces N+1 query patterns by batching lookups and hydrating relation
 * data onto the provided models.
 *
 * @since 1.0.0
 */
class EagerLoader
{
    /**
     * The array of model instances that will have their relations eagerly loaded.
     *
     * @var array $models
     */
    protected $models;

    /**
     * The list of relation method names to be eager loaded for the provided models.
     *
     * @var array $relations
     */
    protected $relations;

    /**
     * Create a new eager loader instance.
     *
     * Stores the models and the requested relation names for later processing.
     * Instances are typically constructed by the query builder when handling
     * with() calls to prefetch related data efficiently.
     *
     * @param array $models The models that will receive related data
     * @param array $relations The relation method names to eager load
     * @return void No return value
     * @since 1.0.0
     */
    public function __construct(array $models, array $relations)
    {
        $this->models = $models;
        $this->relations = $relations;
    }

    /**
     * Execute eager loading for all requested relations.
     *
     * Iterates over the configured relation names and invokes the loader for
     * each. Returns the models array with relations populated on each model
     * instance under their respective relation keys.
     *
     * @return array The array of models with loaded relations
     * @since 1.0.0
     */
    public function load()
    {
        foreach ($this->relations as $relation_name => $nested_relations) {
            $this->load_relation($relation_name, $nested_relations);
        }

        return $this->models;
    }

    /**
     * Load a single relation across all provided models.
     *
     * Determines if the relation method exists, derives the relation object,
     * applies eager constraints, fetches related results, and matches them to
     * their parents. No operation occurs when models are empty or the method
     * is missing.
     *
     * @param string $relation_name The relation method name to load
     * @param mixed $nested_relations Nested relations to load on the related models
     * @return void No return value; updates models in place
     * @since 1.0.0
     */
    protected function load_relation($relation_name, $nested_relations = null)
    {
        if (empty($this->models)) {
            return;
        }

        $first_model = $this->models[0];

        if (!method_exists($first_model, $relation_name)) {
            return;
        }

        /**
         * @var  Relation
         */
        $relation = $first_model->$relation_name();

        $relation->add_eager_constraints($this->models);

        $callback = reset($nested_relations);

        if ($callback instanceof Closure) {
            $callback($relation->get_query());
        }

        $results = $relation->get();

        $this->models = $relation->match($this->models, $results->all(), $relation_name);

        if (!empty($nested_relations) && !$results->is_empty() && !$callback instanceof Closure) {
            $this->load_nested_relations($relation_name, $nested_relations);
        }
    }

    /**
     * Load nested relations on the related models.
     *
     * @param string $relation_name The parent relation name
     * @param array $nested_relations The nested relations to load
     * @return void No return value
     * @since 1.0.0
     */
    protected function load_nested_relations($relation_name, $nested_relations)
    {
        $related_models = [];

        foreach ($this->models as $model) {
            if (!isset($model->relations[$relation_name])) {
                continue;
            }

            $related = $model->relations[$relation_name];

            if ($related instanceof Collection) {
                $related = $related->all();
            }

            if (is_array($related)) {
                $related_models = array_merge($related_models, $related);
            } elseif (is_object($related)) {
                $related_models[] = $related;
            }
        }

        if (!empty($related_models)) {
            (new static($related_models, $nested_relations))->load();
        }
    }
}
