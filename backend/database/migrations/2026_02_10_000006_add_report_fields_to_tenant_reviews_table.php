<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenant_reviews', function (Blueprint $table): void {
            $table->unsignedSmallInteger('stay_duration_months')->after('payment_history');
            $table->string('neighbor_relations', 20)->after('stay_duration_months');
            $table->string('property_care', 20)->after('neighbor_relations');
            $table->string('noise_level', 20)->after('property_care');
            $table->string('would_rent_again', 10)->after('noise_level');
        });
    }

    public function down(): void
    {
        Schema::table('tenant_reviews', function (Blueprint $table): void {
            $table->dropColumn([
                'stay_duration_months',
                'neighbor_relations',
                'property_care',
                'noise_level',
                'would_rent_again',
            ]);
        });
    }
};
