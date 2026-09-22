<?php

namespace Kirki\Ecommerce\App\Actions\Collection;

use Kirki\Ecommerce\App\Models\Collection;
use Kirki\Ecommerce\App\Services\CollectionService;
use Kirki\Ecommerce\App\DTO\Collection\CreateCollectionDTO;
use Kirki\Ecommerce\Framework\Supports\Facades\DB;
use Throwable;

use function Kirki\Ecommerce\Framework\throw_if;

/**
 * Creates a collection together with its product relationships in one transaction.
 *
 * @since 1.0.0
 */
class CreateCollectionAction
{
    /** @var CollectionService */
    protected $collection_service;

    /**
     * Set up the action.
     *
     * @since 1.0.0
     *
     * @param CollectionService $collection_service Collection persistence service.
     */
    public function __construct(CollectionService $collection_service)
    {
        $this->collection_service = $collection_service;
    }

    /**
     * Create a new collection with its product relationships.
     *
     * The collection and its product relationships are created in a single transaction.
     * If either fails, the transaction is rolled back and a Throwable is thrown.
     *
     * @since 1.0.0
     *
     * @param CreateCollectionDTO $payload Collection data with the product ID list.
     * @return Collection The created collection with its relations loaded.
     * @throws Throwable When the collection or its relationships cannot be created.
     */
    public function execute(CreateCollectionDTO $payload)
    {
        DB::begin_transaction();

        try {
            $collection = $this->collection_service->create($payload);

            throw_if(empty($collection), __('Collection could not be created.', 'kirki-ecommerce'));

            $collection->products()->sync($payload->product_ids);

            DB::commit();

            return $this->collection_service->find($collection->id);
        } catch (Throwable $e) {
            DB::rollback();

            throw $e;
        }
    }
}
