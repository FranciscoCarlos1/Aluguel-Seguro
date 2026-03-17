<?php

namespace App\Providers;

use App\Models\Property;
use App\Services\DemoCatalogService;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\ServiceProvider;
use Throwable;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        RateLimiter::for('api', function (Request $request) {
            $key = $request->user()?->id ?? $request->ip();

            return Limit::perMinute(60)->by($key);
        });

        $this->ensureDemoCatalogInProduction();
    }

    private function ensureDemoCatalogInProduction(): void
    {
        if (!$this->app->environment('production') || $this->app->runningInConsole()) {
            return;
        }

        try {
            if (!Schema::hasTable('properties') || Property::query()->exists()) {
                return;
            }

            app(DemoCatalogService::class)->ensureCatalogAvailable();
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
