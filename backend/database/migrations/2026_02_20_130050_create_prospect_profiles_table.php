<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('prospect_profiles', function (Blueprint $table): void {
            $table->id();
            $table->string('full_name', 160);
            $table->string('phone', 30)->unique();
            $table->string('email', 120)->nullable();
            $table->string('occupation', 120)->nullable();
            $table->decimal('monthly_income', 10, 2)->nullable();
            $table->unsignedTinyInteger('household_size')->nullable();
            $table->boolean('has_pet')->default(false);
            $table->text('rental_reason')->nullable();
            $table->text('additional_notes')->nullable();
            $table->enum('payment_probability', ['muito_provavel', 'provavel', 'pouco_provavel', 'improvavel']);
            $table->enum('care_probability', ['muito_provavel', 'provavel', 'pouco_provavel', 'improvavel']);
            $table->enum('income_stability_probability', ['muito_provavel', 'provavel', 'pouco_provavel', 'improvavel']);
            $table->enum('neighbor_relation_probability', ['muito_provavel', 'provavel', 'pouco_provavel', 'improvavel']);
            $table->unsignedTinyInteger('score');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('prospect_profiles');
    }
};
