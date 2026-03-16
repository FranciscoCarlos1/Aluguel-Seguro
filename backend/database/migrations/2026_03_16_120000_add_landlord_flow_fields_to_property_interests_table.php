<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('property_interests', function (Blueprint $table): void {
            $table->string('landlord_decision', 30)->nullable()->after('payment_status');
            $table->text('landlord_notes')->nullable()->after('landlord_decision');
            $table->boolean('hidden_for_prospect')->default(false)->after('landlord_notes');
            $table->timestamp('contact_requested_at')->nullable()->after('paid_at');
            $table->timestamp('rejected_at')->nullable()->after('contact_requested_at');
            $table->timestamp('contract_ready_at')->nullable()->after('rejected_at');
        });
    }

    public function down(): void
    {
        Schema::table('property_interests', function (Blueprint $table): void {
            $table->dropColumn([
                'landlord_decision',
                'landlord_notes',
                'hidden_for_prospect',
                'contact_requested_at',
                'rejected_at',
                'contract_ready_at',
            ]);
        });
    }
};
