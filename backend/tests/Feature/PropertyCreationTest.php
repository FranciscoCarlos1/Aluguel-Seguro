<?php

namespace Tests\Feature;

use App\Models\Landlord;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropertyCreationTest extends TestCase
{
    use RefreshDatabase;

    private function fakePngUpload(string $name): UploadedFile
    {
        $content = base64_decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9pX6lz8AAAAASUVORK5CYII=');

        return UploadedFile::fake()->createWithContent($name, $content);
    }

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

    public function test_landlord_can_create_property_with_uploaded_images(): void
    {
        Storage::fake('public');

        $user = User::factory()->create([
            'email' => 'upload@teste.com',
            'account_type' => 'landlord',
        ]);

        Landlord::create([
            'name' => 'Locador Upload',
            'email' => 'upload@teste.com',
            'phone' => '47999991111',
            'status' => 'active',
            'created_by' => 'upload@teste.com',
            'updated_by' => 'upload@teste.com',
        ]);

        Sanctum::actingAs($user);

        $response = $this->post('/api/v1/landlord/properties', [
            'title' => 'Apartamento com upload',
            'city' => 'Florianopolis',
            'state' => 'SC',
            'rent_price' => 2450,
            'bedrooms' => 2,
            'has_garage' => '1',
            'property_type' => 'apartamento',
            'description' => 'Fotos enviadas direto do celular.',
            'address_neighborhood' => 'Trindade',
            'images' => [
                $this->fakePngUpload('capa.png'),
                $this->fakePngUpload('sala.png'),
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.hero_image_url', fn ($value) => is_string($value) && str_contains($value, '/storage/properties/'))
            ->assertJsonCount(2, 'data.image_urls');

        $this->assertCount(2, Storage::disk('public')->allFiles('properties/1/' . now()->format('Y/m')));
        $this->assertDatabaseHas('properties', [
            'title' => 'Apartamento com upload',
        ]);
    }

    public function test_landlord_can_create_property_when_external_source_columns_are_missing(): void
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

        $user = User::factory()->create([
            'email' => 'retrocompat@teste.com',
            'account_type' => 'landlord',
        ]);

        Landlord::create([
            'name' => 'Locador Retro',
            'email' => 'retrocompat@teste.com',
            'phone' => '47999992222',
            'status' => 'active',
            'created_by' => 'retrocompat@teste.com',
            'updated_by' => 'retrocompat@teste.com',
        ]);

        Sanctum::actingAs($user);

        $response = $this->postJson('/api/v1/landlord/properties', [
            'title' => 'Casa schema antigo',
            'city' => 'Joinville',
            'state' => 'SC',
            'rent_price' => 2100,
            'bedrooms' => 2,
            'has_garage' => true,
            'property_type' => 'casa',
            'description' => 'Criacao resiliente mesmo sem colunas novas.',
            'address_neighborhood' => 'America',
            'hero_image_url' => 'https://cdn.exemplo/capa-antiga.jpg',
            'image_urls' => [
                'https://cdn.exemplo/capa-antiga.jpg',
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.title', 'Casa schema antigo');

        $this->assertDatabaseHas('properties', [
            'title' => 'Casa schema antigo',
            'city' => 'Joinville',
        ]);
    }
}
