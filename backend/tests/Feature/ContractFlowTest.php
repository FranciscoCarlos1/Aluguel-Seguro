<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Landlord;
use App\Models\PaymentSlip;
use App\Models\Property;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class ContractFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_landlord_can_view_owned_contract_with_payment_slips(): void
    {
        [$contract, $user] = $this->createOwnedContract();
        Sanctum::actingAs($user);

        $response = $this->getJson("/api/v1/contracts/{$contract->id}");

        $response
            ->assertOk()
            ->assertJsonPath('contract.id', $contract->id)
            ->assertJsonCount(1, 'contract.payment_slips');
    }

    public function test_landlord_can_sign_owned_contract(): void
    {
        [$contract, $user] = $this->createOwnedContract();
        Sanctum::actingAs($user);

        $response = $this->postJson("/api/v1/contracts/{$contract->id}/sign", [
            'signer_ip' => '127.0.0.1',
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('contract.status', 'signed');

        $this->assertDatabaseHas('contracts', [
            'id' => $contract->id,
            'status' => 'signed',
            'signed_by_ip' => '127.0.0.1',
        ]);
    }

    public function test_landlord_cannot_view_contract_from_another_owner(): void
    {
        [$contract] = $this->createOwnedContract();
        $otherUser = User::factory()->create([
            'email' => 'outro.locador@example.com',
        ]);
        Landlord::create([
            'name' => 'Outro Locador',
            'email' => 'outro.locador@example.com',
            'phone' => '48991112222',
            'status' => 'active',
        ]);

        Sanctum::actingAs($otherUser);

        $this->getJson("/api/v1/contracts/{$contract->id}")
            ->assertStatus(403);
    }

    private function createOwnedContract(): array
    {
        $user = User::factory()->create([
            'email' => 'locador.contrato@example.com',
        ]);

        $landlord = Landlord::create([
            'name' => 'Locador Contrato',
            'email' => 'locador.contrato@example.com',
            'phone' => '48990001111',
            'status' => 'active',
        ]);

        $property = Property::create([
            'landlord_id' => $landlord->id,
            'title' => 'Casa com contrato assistido',
            'city' => 'Blumenau',
            'state' => 'SC',
            'rent_price' => 2100,
            'bedrooms' => 2,
            'has_garage' => true,
            'property_type' => 'casa',
            'description' => 'Imovel pronto para fluxo contratual completo.',
            'address_neighborhood' => 'Velha',
            'is_active' => true,
        ]);

        $tenant = Tenant::create([
            'full_name' => 'Inquilino Contrato',
            'email' => 'inquilino@example.com',
            'phone' => '48993334444',
            'occupation' => 'Auxiliar logistico',
            'monthly_income' => 3200,
            'score' => 84,
            'status' => 'active',
        ]);

        $contract = Contract::create([
            'property_id' => $property->id,
            'landlord_id' => $landlord->id,
            'tenant_id' => $tenant->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addYear()->toDateString(),
            'rent_amount' => 2100,
            'deposit_amount' => 2100,
            'fire_insurance' => 38.5,
            'garbage_fee' => 21.5,
            'status' => 'draft',
            'contract_text' => 'Contrato assistido de teste.',
        ]);

        PaymentSlip::create([
            'contract_id' => $contract->id,
            'due_date' => now()->addDays(7)->toDateString(),
            'amount' => 60,
            'status' => 'pending',
            'bank_code' => '001',
            'bank_slip_number' => 'SLIP-TEST-001',
            'description' => 'Seguro incendio e taxa de lixo',
            'installment_number' => 1,
            'installment_total' => 1,
            'fine' => 0,
            'interest' => 0,
        ]);

        return [$contract, $user];
    }
}