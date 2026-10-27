<?php

namespace Kirki\Ecommerce\App\Mcp\Tools;

defined('ABSPATH') || exit;

use Kirki\Ecommerce\Ahamed\FrameworkMcp\Request;
use Kirki\Ecommerce\Ahamed\FrameworkMcp\Response;
use Kirki\Ecommerce\App\Services\SetupChecklistService;

/**
 * Tells which store setup steps are done and which are open, as on the Home page checklist.
 *
 * @since 1.0.0
 */
class SetupStatusTool extends StoreReadTool
{
    const STEP_PAGES = [
        SetupChecklistService::STEP_PRODUCTS => '#/products/create',
        SetupChecklistService::STEP_PAYMENTS => '#/settings/payments',
        SetupChecklistService::STEP_TAX => '#/settings/tax',
        SetupChecklistService::STEP_SHIPPING => '#/settings/shipping',
    ];

    /** @var string */
    protected $description = 'Get the setup steps of the store (products, payments, tax, shipping) in the order of the Home page checklist, '
        . 'with whether each step is completed or was preconfigured, and the admin page where the merchant does the step. '
        . 'Use it to guide a new merchant to the first sale.';

    /** @var SetupChecklistService */
    protected $checklist_service;

    /**
     * Create the tool with the setup checklist service.
     *
     * @since 1.0.0
     *
     * @param SetupChecklistService $checklist_service Service of the Home page checklist.
     */
    public function __construct(SetupChecklistService $checklist_service)
    {
        $this->checklist_service = $checklist_service;
    }

    /**
     * Get the setup steps. Like the Home page, this records the steps that are newly met.
     *
     * @since 1.0.0
     *
     * @param Request $request Tool arguments. The tool takes none.
     *
     * @return Response
     */
    public function handle(Request $request)
    {
        $steps = [];

        foreach ($this->checklist_service->get_state() as $step) {
            $steps[] = [
                'id' => $step['id'],
                'is_completed' => $step['is_completed'],
                'is_preconfigured' => $step['is_preconfigured'],
                'admin_page' => admin_url('admin.php?page=kirki-ecommerce' . (static::STEP_PAGES[$step['id']] ?? '')),
            ];
        }

        return Response::structured([
            'steps' => $steps,
            'all_completed' => $this->checklist_service->is_complete(),
        ]);
    }
}
