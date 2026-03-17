<?php

namespace Tests\Feature;

use App\Models\Landlord;
use App\Models\Property;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DemoCatalogCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_catalog_command_populates_demo_properties_when_table_is_empty(): void
    {
        $this->artisan('catalog:ensure-demo')
            ->expectsOutput('Catalogo demo garantido com 10 imovel(is) criado(s).')
            ->assertExitCode(0);

        $this->assertDatabaseCount('properties', 10);
        $this->assertDatabaseHas('landlords', [
            'email' => 'locador@aluguelseguro.com',
        ]);
    }

    public function test_catalog_command_preserves_existing_properties(): void
    {
        $landlord = Landlord::create([
            'name' => 'Locador Real',
            'email' => 'locador.real@example.com',
            'phone' => '47999997777',
            'status' => 'active',
        ]);

        Property::create([
            'landlord_id' => $landlord->id,
            'title' => 'Imovel ja cadastrado',
            'city' => 'Joinville',
            'state' => 'SC',
            'rent_price' => 2000,
            'bedrooms' => 2,
            'has_garage' => true,
            'property_type' => 'apartamento',
            'description' => 'Registro real que nao deve ser apagado nem sobrescrito.',
            'is_active' => true,
        ]);

        $this->artisan('catalog:ensure-demo')
            ->expectsOutput('Catalogo preservado: nenhum imovel demo precisou ser recriado.')
            ->assertExitCode(0);

        $this->assertDatabaseCount('properties', 1);
        $this->assertDatabaseHas('properties', [
            'title' => 'Imovel ja cadastrado',
            'city' => 'Joinville',
        ]);
    }
}
