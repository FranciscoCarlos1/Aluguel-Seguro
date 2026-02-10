<?php

use App\Http\Controllers\Api\LandlordController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\TenantProfileController;
use App\Http\Controllers\Api\TenantReviewController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Middleware\ApiAuditLog;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::prefix('v1')->group(function () {
    Route::middleware('throttle:api')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);
    });

    Route::middleware(['auth:sanctum', 'throttle:api', ApiAuditLog::class])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::post('/landlords', [LandlordController::class, 'store']);
        Route::get('/landlords/{landlord}', [LandlordController::class, 'show']);

        Route::post('/tenants', [TenantController::class, 'store']);
        Route::get('/tenants', [TenantController::class, 'index']);
        Route::get('/tenants/{tenant}', [TenantController::class, 'show']);

        Route::get('/tenants/{tenant}/profile', [TenantProfileController::class, 'show']);
        Route::post('/tenants/{tenant}/profile', [TenantProfileController::class, 'store']);

        Route::get('/tenants/{tenant}/reviews', [TenantReviewController::class, 'index']);
        Route::post('/tenants/{tenant}/reviews', [TenantReviewController::class, 'store']);
    });
});
