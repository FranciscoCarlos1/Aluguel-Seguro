<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('prospect_profiles', function (Blueprint $table): void {
            $table->json('behavioral_answers')->nullable()->after('additional_notes');
        });
    }

    public function down(): void
    {
        Schema::table('prospect_profiles', function (Blueprint $table): void {
            $table->dropColumn('behavioral_answers');
        });
    }
};
