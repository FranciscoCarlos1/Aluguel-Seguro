<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_profiles', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->text('summary_text')->nullable();
            $table->text('references_text')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedTinyInteger('score')->nullable();
            $table->string('status', 20)->default('draft');
            $table->timestamp('consent_at')->nullable();
            $table->string('consent_source', 120)->nullable();
            $table->string('consent_ip', 45)->nullable();
            $table->string('consent_version', 50)->nullable();
            $table->date('data_retention_until')->nullable();
            $table->string('created_by', 120)->nullable();
            $table->string('updated_by', 120)->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->unique('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_profiles');
    }
};
