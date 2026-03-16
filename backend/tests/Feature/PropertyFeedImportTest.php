<?php

namespace Tests\Feature;

use App\Models\Landlord;
use App\Models\Property;
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

    public function test_landlord_can_send_local_properties_to_official_olx_import_api(): void
    {
        $user = User::factory()->create([
            'email' => 'olx@example.com',
        ]);
        $landlord = Landlord::create([
            'name' => 'Locador OLX',
            'email' => 'olx@example.com',
            'phone' => '47999998888',
            'status' => 'active',
        ]);

        $property = Property::create([
            'landlord_id' => $landlord->id,
            'title' => 'Apartamento pronto para exportacao OLX',
            'city' => 'Sao Bento do Sul',
            'state' => 'SC',
            'rent_price' => 1800,
            'bedrooms' => 2,
            'has_garage' => true,
            'property_type' => 'apartamento',
            'description' => 'Imovel com imagens e dados basicos para exportacao.',
            'address_neighborhood' => 'Centro',
            'hero_image_url' => 'https://cdn.exemplo/imovel.jpg',
            'image_urls' => ['https://cdn.exemplo/imovel.jpg'],
            'is_active' => true,
        ]);

        Sanctum::actingAs($user);

        Http::fake([
            'https://apps.olx.com.br/autoupload/import' => Http::response([
                'token' => 'import-token-123',
                'statusCode' => 0,
                'statusMessage' => 'The ads were imported and will be processed',
                'errors' => [],
            ], 200),
        ]);

        $response = $this->postJson('/api/v1/integrations/olx/import-properties', [
            'access_token' => 'token-oficial-olx',
            'property_ids' => [$property->id],
            'category' => 1010,
            'zipcode' => '89280000',
            'phone' => '47999998888',
            'type' => 'u',
            'params' => [],
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('olx.statusCode', 0)
            ->assertJsonPath('properties.0.id', $property->id);
    }

    public function test_can_list_published_ads_from_olx_official_api(): void
    {
        $user = User::factory()->create([
            'email' => 'published@example.com',
        ]);
        Landlord::create([
            'name' => 'Consulta OLX',
            'email' => 'published@example.com',
            'phone' => '47988887777',
            'status' => 'active',
        ]);

        Sanctum::actingAs($user);

        Http::fake([
            'https://apps.olx.com.br/autoupload/v1/published*' => Http::response([
                'data' => [
                    [
                        'id' => 'AS-1',
                        'list_id' => '129989',
                        'status' => 'published',
                    ],
                ],
                'current_token' => null,
                'next_token' => null,
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/integrations/olx/published-ads?access_token=token-oficial-olx&ads_status=published&fetch_size=10');

        $response
            ->assertOk()
            ->assertJsonPath('data.0.id', 'AS-1')
            ->assertJsonPath('data.0.status', 'published');
    }

    public function test_can_search_external_properties_with_google_engine_inside_system(): void
    {
        config()->set('services.google_search.api_key', 'google-key');
        config()->set('services.google_search.engine_id', 'google-cx');

        Http::fake([
            'https://www.googleapis.com/customsearch/v1*' => Http::response([
                'items' => [
                    [
                        'title' => 'Apartamento para aluguel em Sao Bento do Sul',
                        'link' => 'https://www.olx.com.br/imovel-123',
                        'snippet' => 'Anuncio externo retornado pelo Google.',
                        'displayLink' => 'www.olx.com.br',
                    ],
                ],
            ], 200),
        ]);

        $response = $this->getJson('/api/v1/external-search/google?city=Sao%20Bento%20do%20Sul&property_type=apartamento&bedrooms=2');

        $response
            ->assertOk()
            ->assertJsonPath('source', 'google')
            ->assertJsonPath('data.0.title', 'Apartamento para aluguel em Sao Bento do Sul')
            ->assertJsonPath('data.0.display_link', 'www.olx.com.br');
    }

    public function test_google_search_returns_controlled_error_when_not_configured(): void
    {
        config()->set('services.google_search.api_key', null);
        config()->set('services.google_search.engine_id', null);

        $response = $this->getJson('/api/v1/external-search/google?city=Joinville');

        $response
            ->assertStatus(503)
            ->assertJsonPath('source', 'google')
            ->assertJsonPath('data', [])
            ->assertJsonPath('message', 'A busca Google do sistema ainda nao foi configurada. Defina GOOGLE_SEARCH_API_KEY e GOOGLE_SEARCH_ENGINE_ID.');
    }
}
