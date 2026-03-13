<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_slips', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('contract_id')->constrained()->cascadeOnDelete();
            $table->date('due_date');
            $table->decimal('amount', 10, 2);
            $table->string('status', 20)->default('pending');
            $table->string('bank_code', 10)->nullable();
            $table->string('bank_slip_number', 40)->nullable();
            $table->string('pdf_url', 255)->nullable();
            $table->string('payment_link', 255)->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->decimal('fine', 10, 2)->nullable();
            $table->decimal('interest', 10, 2)->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_slips');
    }
};
