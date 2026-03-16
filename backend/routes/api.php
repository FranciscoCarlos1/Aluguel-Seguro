<?php

use App\Http\Controllers\Api\LandlordController;
use App\Http\Controllers\Api\LandlordInterestController;
use App\Http\Controllers\Api\PaymentSlipController;
use App\Http\Controllers\Api\SupportTicketController;
use App\Http\Controllers\Api\TenantController;
use App\Http\Controllers\Api\TenantProfileController;
use App\Http\Controllers\Api\TenantReviewController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ContractController;
use App\Http\Controllers\Api\PropertyController;
use App\Http\Controllers\Api\PropertyInterestController;
use App\Http\Controllers\Api\ProspectProfileController;
use App\Http\Controllers\Api\VisitScheduleController;
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
        Route::get('/landlord/properties', [PropertyController::class, 'landlordIndex']);
        Route::post('/landlord/properties', [PropertyController::class, 'store']);

        Route::get('/landlord/interests', [LandlordInterestController::class, 'index']);
        Route::post('/landlord/interests/{interest}/mark-paid', [LandlordInterestController::class, 'markPaid']);
        Route::post('/landlord/interests/{interest}/request-contact', [LandlordInterestController::class, 'requestContact']);
        Route::post('/landlord/interests/{interest}/reject', [LandlordInterestController::class, 'reject']);
        Route::post('/landlord/interests/{interest}/generate-contract', [LandlordInterestController::class, 'generateContract']);

        Route::get('/landlord/visits', [VisitScheduleController::class, 'index']);
        Route::post('/landlord/visits/{visit}/confirm', [VisitScheduleController::class, 'confirm']);
        Route::post('/landlord/visits/{visit}/cancel', [VisitScheduleController::class, 'cancel']);

        Route::get('/landlord/support-tickets', [SupportTicketController::class, 'index']);
        Route::post('/landlord/support-tickets', [SupportTicketController::class, 'store']);

        Route::post('/tenants', [TenantController::class, 'store']);
        Route::get('/tenants', [TenantController::class, 'index']);
        Route::get('/tenants/{tenant}', [TenantController::class, 'show']);
        Route::put('/tenants/{tenant}', [TenantController::class, 'update']);

        Route::get('/tenants/{tenant}/profile', [TenantProfileController::class, 'show']);
        Route::post('/tenants/{tenant}/profile', [TenantProfileController::class, 'store']);

        Route::get('/tenants/{tenant}/reviews', [TenantReviewController::class, 'index']);
        Route::post('/tenants/{tenant}/reviews', [TenantReviewController::class, 'store']);
        Route::post('/tenants/{tenant}/reviews/{review}/media', [\App\Http\Controllers\Api\TenantReviewMediaController::class, 'store']);
        Route::delete('/tenants/{tenant}/reviews/{review}/media/{media}', [\App\Http\Controllers\Api\TenantReviewMediaController::class, 'destroy']);

        // Contratos digitais
        Route::post('/contracts/generate', [ContractController::class, 'generate']);
        Route::get('/contracts/{contract}', [ContractController::class, 'show']);
        Route::post('/contracts/{contract}/sign', [ContractController::class, 'sign']);

        // Boletos e cobrança
        Route::post('/payment-slips/generate', [PaymentSlipController::class, 'generate']);
        Route::get('/payment-slips/{slip}', [PaymentSlipController::class, 'show']);
        Route::post('/payment-slips/{slip}/mark-paid', [PaymentSlipController::class, 'markAsPaid']);
    });
});
