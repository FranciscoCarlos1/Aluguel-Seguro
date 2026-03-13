<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('properties', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('landlord_id')->constrained()->cascadeOnDelete();
            $table->string('title', 160);
            $table->string('city', 120);
            $table->string('state', 2)->default('SC');
            $table->decimal('rent_price', 10, 2);
            $table->unsignedTinyInteger('bedrooms')->default(1);
            $table->boolean('has_garage')->default(false);
            $table->enum('property_type', ['kitnet', 'casa', 'apartamento', 'casa_condominio']);
            $table->text('description')->nullable();
            $table->string('address_line', 180)->nullable();
            $table->string('address_number', 20)->nullable();
            $table->string('address_neighborhood', 120)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['state', 'city']);
            $table->index(['rent_price']);
            $table->index(['property_type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('properties');
    }
};
