<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('visit_schedules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_interest_id')->constrained('property_interests')->cascadeOnDelete();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('landlord_id')->constrained()->cascadeOnDelete();
            $table->timestamp('scheduled_for')->nullable();
            $table->string('status', 20)->default('requested');
            $table->string('mode', 20)->default('presencial');
            $table->string('operator_name', 120)->nullable();
            $table->text('notes')->nullable();
            $table->string('created_by', 120)->nullable();
            $table->timestamps();

            $table->index(['status', 'scheduled_for']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('visit_schedules');
    }
};
