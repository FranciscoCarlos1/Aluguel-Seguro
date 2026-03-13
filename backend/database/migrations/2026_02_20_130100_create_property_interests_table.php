<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('property_interests', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('property_id')->constrained()->cascadeOnDelete();
            $table->foreignId('prospect_profile_id')->constrained()->cascadeOnDelete();
            $table->decimal('analysis_fee', 8, 2)->default(5.99);
            $table->string('payment_status', 20)->default('pending');
            $table->string('payment_reference', 50)->unique();
            $table->text('pix_copy_paste');
            $table->text('pix_qr_payload')->nullable();
            $table->timestamp('paid_at')->nullable();
            $table->string('profile_access_token', 80);
            $table->timestamp('central_notified_at')->nullable();
            $table->timestamps();

            $table->index(['payment_status']);
            $table->index(['created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('property_interests');
    }
};
