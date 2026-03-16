<?php

namespace Tests\Feature;

use App\Models\Landlord;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropertyFeedImportTest extends TestCase
{
    use RefreshDatabase;

    public function test_landlord_can_import_properties_from_authorized_json_feed(): void
    {
        $user = User::factory()->create([
            'email' => 'importador@example.com',
        ]);
        Landlord::create([
            'name' => 'Importador',
            'email' => 'importador@example.com',
            'phone' => '48995556666',
            'status' => 'active',
        ]);

        Sanctum::actingAs($user);

        Http::fake([
            'https://feed.autorizado.exemplo/imoveis.json' => Http::response([
                'items' => [
                    [
                        'id' => 'olx-001',
                        'title' => 'Apartamento importado de fonte autorizada',
                        'city' => 'Sao Bento do Sul',
                        'state' => 'SC',
                        'price' => 1650,
                        'bedrooms' => 2,
                        'has_garage' => true,
                        'type' => 'apartamento',
                        'description' => 'Imovel recebido por feed JSON.',
                        'neighborhood' => 'Centro',
                        'url' => 'https://parceiro.exemplo/imovel/olx-001',
                        'images' => ['https://cdn.exemplo/imovel-1.jpg'],
                    ],
                ],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/landlord/properties/import-feed', [
            'feed_url' => 'https://feed.autorizado.exemplo/imoveis.json',
            'source_name' => 'olx_parceiro',
            'format' => 'json',
        ]);

        $response
            ->assertStatus(201)
            ->assertJsonPath('properties.0.title', 'Apartamento importado de fonte autorizada')
            ->assertJsonPath('properties.0.source_name', 'olx_parceiro');

        $this->assertDatabaseHas('properties', [
            'source_name' => 'olx_parceiro',
            'source_reference' => 'olx-001',
            'city' => 'Sao Bento do Sul',
        ]);
    }
}
