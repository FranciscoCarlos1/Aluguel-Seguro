<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('support_tickets', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('landlord_id')->nullable()->constrained()->nullOnDelete();
            $table->string('name', 120);
            $table->string('phone', 30);
            $table->string('topic', 160);
            $table->string('preferred_time', 120)->nullable();
            $table->text('notes')->nullable();
            $table->string('status', 40)->default('Recebido pela equipe');
            $table->string('contact_channel', 30)->default('telefone_e_whatsapp');
            $table->string('created_by', 120)->nullable();
            $table->timestamp('responded_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_tickets');
    }
};
