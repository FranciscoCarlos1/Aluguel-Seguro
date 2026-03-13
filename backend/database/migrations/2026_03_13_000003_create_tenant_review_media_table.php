<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_review_media', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('tenant_review_id')->constrained()->cascadeOnDelete();
            $table->string('media_type', 20); // photo, video
            $table->string('url', 255);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_review_media');
    }
};
