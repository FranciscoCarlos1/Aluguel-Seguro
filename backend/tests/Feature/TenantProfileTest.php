<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_tenant_and_profile(): void
    {
        Sanctum::actingAs(User::factory()->create());

        $tenantResponse = $this->postJson('/api/v1/tenants', [
            'full_name' => 'Inquilino Demo',
            'cpf' => '123.456.789-00',
            'rg' => '12.345.678-9',
            'email' => 'inquilino@example.com',
            'phone' => '(11) 99999-0000',
            'occupation' => 'Analista',
            'monthly_income' => 4500,
            'address_line' => 'Rua Central',
            'address_number' => '123',
            'address_complement' => 'Apto 10',
            'address_neighborhood' => 'Centro',
            'address_city' => 'Sao Paulo',
            'address_state' => 'SP',
            'address_postal_code' => '01000-000',
            'notes' => 'Sem observacoes',
        ]);

        $tenantResponse->assertStatus(201);

        $tenantId = $tenantResponse->json('data.id');

        $profileResponse = $this->postJson("/api/v1/tenants/{$tenantId}/profile", [
            'summary_text' => 'Resumo inicial',
            'references_text' => 'Contato de referencia',
            'notes' => 'Sem riscos',
            'score' => 75,
            'status' => 'active',
            'consent_at' => now()->toISOString(),
            'consent_source' => 'teste',
        ]);

        $profileResponse
            ->assertStatus(201)
            ->assertJsonStructure([
                'data' => ['summary_text', 'references_text', 'score', 'status'],
            ]);

        $showResponse = $this->getJson("/api/v1/tenants/{$tenantId}");

        $showResponse
            ->assertStatus(200)
            ->assertJsonStructure([
                'data' => ['id', 'full_name', 'profile'],
            ]);
    }
}
