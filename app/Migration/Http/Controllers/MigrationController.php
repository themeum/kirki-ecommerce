<?php

namespace Kirki\Ecommerce\App\Migration\Http\Controllers;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Http\Requests\MigrationScanRequest;
use Kirki\Ecommerce\App\Migration\Http\Requests\MigrationStartRequest;
use Kirki\Ecommerce\App\Migration\Contracts\MigrationSource;
use Kirki\Ecommerce\App\Migration\Core\MigrationReverter;
use Kirki\Ecommerce\App\Migration\Core\MigrationRunner;
use Kirki\Ecommerce\App\Migration\Core\SourceRegistry;
use Kirki\Ecommerce\App\Migration\Models\MigrationRun;
use Kirki\Ecommerce\Framework\Contracts\Request;
use Kirki\Ecommerce\Framework\Exceptions\NotFoundException;
use Kirki\Ecommerce\Framework\Exceptions\ValidationException;
use Kirki\Ecommerce\Framework\Http\Response;

use function Kirki\Ecommerce\Framework\response;
use function Kirki\Ecommerce\Framework\throw_if;

/**
 * REST controller that detects migration sources, scans them and runs a migration chunk by chunk.
 *
 * @since 1.0.0
 */
class MigrationController
{
    /** @var SourceRegistry */
    protected $registry;

    /** @var MigrationRunner */
    protected $runner;

    /** @var MigrationReverter */
    protected $reverter;

    /**
     * Create the controller with the source registry, the runner and the reverter.
     *
     * @since 1.0.0
     *
     * @param SourceRegistry    $registry
     * @param MigrationRunner   $runner
     * @param MigrationReverter $reverter
     */
    public function __construct(SourceRegistry $registry, MigrationRunner $runner, MigrationReverter $reverter)
    {
        $this->registry = $registry;
        $this->runner = $runner;
        $this->reverter = $reverter;
    }

    /**
     * List the detected sources with their version state and extensions.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The detected sources.
     */
    public function sources(Request $request)
    {
        $sources = [];

        foreach ($this->registry->all() as $source) {
            if (!$source->detect()) {
                continue;
            }

            $sources[] = [
                'id' => $source->id(),
                'label' => $source->label(),
                'version' => $source->version_state(),
                'extensions' => $source->extensions(),
            ];
        }

        return response()->json([
            'data' => $sources,
            'message' => __('Migration sources retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Scan a source for the data groups that can be migrated. Only reads data.
     *
     * @since 1.0.0
     *
     * @param MigrationScanRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The groups with their counts.
     */
    public function scan(MigrationScanRequest $request)
    {
        $request->validated();
        $source = $this->usable_source($request->sanitized()['source']);

        return response()->json([
            'data' => $this->runner->scan($source)->to_array(),
            'message' => __('Scan completed successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Get the latest run of a source that was not reverted, so a reloaded page can show its state.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The run, or null when there is none.
     */
    public function latest(Request $request)
    {
        $run = $this->runner->latest_run($request->string('source'));

        return response()->json([
            'data' => $run ? $this->present($run) : null,
            'message' => __('Migration run retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Start a run for the chosen groups, or return the unfinished run of the source.
     *
     * @since 1.0.0
     *
     * @param MigrationStartRequest $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The run.
     */
    public function start(MigrationStartRequest $request)
    {
        $request->validated();
        $payload = $request->sanitized();
        $source = $this->usable_source($payload['source']);

        $run = $this->runner->start($source, $payload['groups']);

        return response()->json([
            'data' => $this->present($run),
            'message' => __('Migration started.', 'kirki-ecommerce'),
        ], Response::CREATED);
    }

    /**
     * Run the next chunk of a run and return its progress.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The progress after the chunk.
     */
    public function chunk(Request $request)
    {
        $run = $this->find_run($request->int('id'));

        return response()->json([
            'data' => $this->runner->next_chunk($run),
            'message' => __('Migration chunk completed.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Start reverting a run.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The run.
     */
    public function revert(Request $request)
    {
        $run = $this->reverter->start($this->find_run($request->int('id')));

        return response()->json([
            'data' => $this->present($run),
            'message' => __('Revert started.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Run the next revert chunk of a run and return its progress.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The progress after the chunk.
     */
    public function revert_chunk(Request $request)
    {
        return response()->json([
            'data' => $this->reverter->next_chunk($this->find_run($request->int('id'))),
            'message' => __('Revert chunk completed.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Get the saved state and report of a run.
     *
     * @since 1.0.0
     *
     * @param Request $request
     * @return \Kirki\Ecommerce\Framework\Http\JsonResponse The run.
     */
    public function show(Request $request)
    {
        return response()->json([
            'data' => $this->present($this->find_run($request->int('id'))),
            'message' => __('Migration run retrieved successfully.', 'kirki-ecommerce'),
        ]);
    }

    /**
     * Get a detected source whose version can be migrated from.
     *
     * @since 1.0.0
     *
     * @param string $id The source id.
     * @return MigrationSource
     * @throws NotFoundException   When the source is unknown or not detected.
     * @throws ValidationException When the installed version is below the minimum.
     */
    protected function usable_source(string $id)
    {
        $source = $this->registry->get($id);

        throw_if(empty($source) || !$source->detect(), __('Migration source could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        throw_if(!$source->version_state()['supported'], __('The installed version of the source plugin is not supported. Update it first.', 'kirki-ecommerce'), ValidationException::class, Response::UNPROCESSABLE_ENTITY);

        return $source;
    }

    /**
     * Find a run or fail.
     *
     * @since 1.0.0
     *
     * @param int $id The run id.
     * @return MigrationRun
     * @throws NotFoundException When the run does not exist.
     */
    protected function find_run(int $id)
    {
        $run = MigrationRun::find($id);

        throw_if(empty($run), __('Migration run could not be found.', 'kirki-ecommerce'), NotFoundException::class, Response::NOT_FOUND);

        return $run;
    }

    /**
     * Shape a run for the response.
     *
     * @since 1.0.0
     *
     * @param MigrationRun $run The run.
     * @return array<string, mixed>
     */
    protected function present(MigrationRun $run)
    {
        return [
            'id' => (int) $run->id,
            'source' => $run->source,
            'status' => $run->status,
            'groups' => $run->groups ?: [],
            'skipped_items' => $run->skipped_items ?: [],
            'revert' => $this->reverter->progress($run),
            'last_error' => $run->last_error,
        ];
    }
}
