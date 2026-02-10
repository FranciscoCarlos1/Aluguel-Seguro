<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('landlords', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 120);
            $table->string('email', 120)->unique();
            $table->string('phone', 30);
            $table->string('company_name', 120)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('active');
            $table->string('created_by', 120)->nullable();
            $table->string('updated_by', 120)->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('landlords');
    }
};
