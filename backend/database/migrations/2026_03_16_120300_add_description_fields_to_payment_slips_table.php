<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('payment_slips', function (Blueprint $table): void {
            $table->string('description', 160)->nullable()->after('payment_link');
            $table->unsignedTinyInteger('installment_number')->nullable()->after('description');
            $table->unsignedTinyInteger('installment_total')->nullable()->after('installment_number');
        });
    }

    public function down(): void
    {
        Schema::table('payment_slips', function (Blueprint $table): void {
            $table->dropColumn(['description', 'installment_number', 'installment_total']);
        });
    }
};
