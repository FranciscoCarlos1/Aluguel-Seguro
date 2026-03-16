<?php

namespace Tests\Feature;

use App\Models\Landlord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropertyCreationTest extends TestCase
{
    use RefreshDatabase;

    public function test_landlord_can_create_property_with_image_urls(): void
    {
        $user = User::factory()->create([
            'email' => 'locador@teste.com',
            'account_type' => 'landlord',
        ]);

        Landlord::create([
            'name' => 'Locador Teste',
            'email' => 'locador@teste.com',
            'phone' => '47999990000',
            'status' => 'active',
            'created_by' => 'locador@teste.com',
            'updated_by' => 'locador@teste.com',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/landlord/properties', [
            'title' => 'Casa com imagens',
            'city' => 'Joinville',
            'state' => 'SC',
            'rent_price' => 2200,
            'bedrooms' => 2,
            'has_garage' => true,
            'property_type' => 'casa',
            'description' => 'Casa completa com fotos na vitrine.',
            'address_neighborhood' => 'America',
            'hero_image_url' => 'https://cdn.exemplo/capa.jpg',
            'image_urls' => [
                'https://cdn.exemplo/capa.jpg',
                'https://cdn.exemplo/sala.jpg',
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.hero_image_url', 'https://cdn.exemplo/capa.jpg')
            ->assertJsonPath('data.image_urls.1', 'https://cdn.exemplo/sala.jpg');

        $this->assertDatabaseHas('properties', [
            'title' => 'Casa com imagens',
            'hero_image_url' => 'https://cdn.exemplo/capa.jpg',
        ]);
    }
}
