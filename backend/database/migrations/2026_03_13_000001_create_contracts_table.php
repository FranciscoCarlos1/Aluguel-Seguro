<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('contracts', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('landlord_id')->constrained()->cascadeOnDelete();
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('property_interest_id')->nullable()->constrained()->nullOnDelete();
            $table->date('start_date');
            $table->date('end_date')->nullable();
            $table->decimal('rent_amount', 10, 2);
            $table->decimal('deposit_amount', 10, 2)->nullable();
            $table->decimal('fire_insurance', 10, 2)->nullable();
            $table->decimal('garbage_fee', 10, 2)->nullable();
            $table->string('status', 20)->default('draft');
            $table->text('contract_text');
            $table->timestamp('signed_at')->nullable();
            $table->string('signed_by_ip', 45)->nullable();
            $table->string('signature_hash', 128)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('contracts');
    }
};
