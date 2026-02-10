<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->string('cpf', 20)->nullable()->after('full_name');
            $table->string('rg', 20)->nullable()->after('cpf');
            $table->string('address_line', 180)->nullable()->after('monthly_income');
            $table->string('address_number', 20)->nullable()->after('address_line');
            $table->string('address_complement', 120)->nullable()->after('address_number');
            $table->string('address_neighborhood', 120)->nullable()->after('address_complement');
            $table->string('address_city', 120)->nullable()->after('address_neighborhood');
            $table->string('address_state', 40)->nullable()->after('address_city');
            $table->string('address_postal_code', 12)->nullable()->after('address_state');
        });
    }

    public function down(): void
    {
        Schema::table('tenants', function (Blueprint $table): void {
            $table->dropColumn([
                'cpf',
                'rg',
                'address_line',
                'address_number',
                'address_complement',
                'address_neighborhood',
                'address_city',
                'address_state',
                'address_postal_code',
            ]);
        });
    }
};
