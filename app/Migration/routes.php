<?php

defined('ABSPATH') || exit;

use Kirki\Ecommerce\App\Migration\Http\Controllers\MigrationController;
use Kirki\Ecommerce\Framework\Middlewares\AdminMiddleware;
use Kirki\Ecommerce\Framework\Middlewares\AuthMiddleware;
use Kirki\Ecommerce\Framework\Route;

Route::group(['middleware' => [AuthMiddleware::class, AdminMiddleware::class]], function () {
    Route::get('/migration/sources', [MigrationController::class, 'sources']);
    Route::post('/migration/scan', [MigrationController::class, 'scan']);
    Route::get('/migration/runs/latest', [MigrationController::class, 'latest']);
    Route::post('/migration/runs', [MigrationController::class, 'start']);
    Route::get('/migration/runs/{id}', [MigrationController::class, 'show']);
    Route::post('/migration/runs/{id}/chunk', [MigrationController::class, 'chunk']);
    Route::post('/migration/runs/{id}/revert', [MigrationController::class, 'revert']);
    Route::post('/migration/runs/{id}/revert/chunk', [MigrationController::class, 'revert_chunk']);
});
