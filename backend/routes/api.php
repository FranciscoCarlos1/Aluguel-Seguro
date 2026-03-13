<?php

use App\Http\Controllers\Api\LandlordController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\TenantProfileController;
use App\Http\Controllers\Api\TenantReviewController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\PropertyInterestController;
use App\Http\Controllers\Api\ProspectProfileController;
use App\Http\Middleware\ApiAuditLog;
use Illuminate\Support\Facades\Route;

Route::get('/health', function () {
    return response()->json(['status' => 'ok']);
});

Route::prefix('v1')->group(function () {
    Route::middleware('throttle:api')->group(function () {
        Route::post('/auth/register', [AuthController::class, 'register']);
        Route::post('/auth/login', [AuthController::class, 'login']);

        Route::get('/properties', [PropertyController::class, 'index']);
        Route::get('/properties/{property}', [PropertyController::class, 'show']);
        Route::post('/properties/{property}/interests', [PropertyInterestController::class, 'store']);
        Route::post('/property-interests/confirm-payment', [PropertyInterestController::class, 'confirmPayment']);
        Route::get('/prospect-profiles/lookup', [ProspectProfileController::class, 'lookup']);
        Route::get('/prospect-profiles/access/{token}', [ProspectProfileController::class, 'access']);
    });

    Route::middleware(['auth:sanctum', 'throttle:api', ApiAuditLog::class])->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);

        Route::post('/landlords', [LandlordController::class, 'store']);
        Route::get('/landlords/me', [LandlordController::class, 'showMe']);
        Route::get('/landlords/{landlord}', [LandlordController::class, 'show']);
        Route::put('/landlords/{landlord}', [LandlordController::class, 'update']);

        Route::post('/tenants', [TenantController::class, 'store']);
        Route::get('/tenants', [TenantController::class, 'index']);
        Route::get('/tenants/{tenant}', [TenantController::class, 'show']);
        Route::put('/tenants/{tenant}', [TenantController::class, 'update']);

        Route::get('/tenants/{tenant}/profile', [TenantProfileController::class, 'show']);
        Route::post('/tenants/{tenant}/profile', [TenantProfileController::class, 'store']);

        Route::get('/tenants/{tenant}/reviews', [TenantReviewController::class, 'index']);
        Route::post('/tenants/{tenant}/reviews', [TenantReviewController::class, 'store']);
    });
});
