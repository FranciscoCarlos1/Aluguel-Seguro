<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->string('source_name', 80)->nullable()->after('landlord_id');
            $table->string('source_reference', 120)->nullable()->after('source_name');
            $table->string('source_url', 500)->nullable()->after('description');
            $table->string('hero_image_url', 500)->nullable()->after('source_url');
            $table->json('image_urls')->nullable()->after('hero_image_url');

            $table->index(['source_name', 'source_reference']);
        });
    }

    public function down(): void
    {
        Schema::table('properties', function (Blueprint $table): void {
            $table->dropIndex(['source_name', 'source_reference']);
            $table->dropColumn([
                'source_name',
                'source_reference',
                'source_url',
                'hero_image_url',
                'image_urls',
            ]);
        });
    }
};