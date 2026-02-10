<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table): void {
            $table->id();
            $table->string('full_name', 160);
            $table->string('email', 120)->nullable()->unique();
            $table->string('phone', 30)->nullable();
            $table->string('occupation', 120);
            $table->decimal('monthly_income', 10, 2);
            $table->string('document_last4', 4)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 20)->default('active');
            $table->string('created_by', 120)->nullable();
            $table->string('updated_by', 120)->nullable();
            $table->timestamp('data_redacted_at')->nullable();
            $table->timestamps();
            $table->softDeletes();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
