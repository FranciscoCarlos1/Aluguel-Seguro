<?php

namespace Tests\Feature;

use App\Models\Contract;
use App\Models\Landlord;
use App\Models\PaymentSlip;
use App\Models\Property;
use App\Models\PropertyInterest;
use App\Models\ProspectProfile;
use App\Models\Tenant;
use App\Models\User;
use App\Models\VisitSchedule;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TenantInterestTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_can_list_only_their_visible_interests(): void
    {
        $user = User::factory()->create([
            'name' => 'Inquilina Teste',
            'email' => 'tenant@example.com',
            'account_type' => 'tenant',
        ]);

        Tenant::query()->create([
            'full_name' => 'Inquilina Teste',
            'email' => 'tenant@example.com',
            'phone' => '(48) 99999-1111',
            'occupation' => 'Analista',
            'monthly_income' => 4200,
        ]);

        $profile = ProspectProfile::query()->create([
            'full_name' => 'Inquilina Teste',
            'phone' => '48999991111',
            'email' => 'tenant@example.com',
            'occupation' => 'Analista',
            'monthly_income' => 4200,
            'household_size' => 2,
            'has_pet' => false,
            'payment_probability' => 'muito_provavel',
            'care_probability' => 'provavel',
            'income_stability_probability' => 'muito_provavel',
            'neighbor_relation_probability' => 'provavel',
            'score' => 88,
        ]);

        $otherProfile = ProspectProfile::query()->create([
            'full_name' => 'Outro Perfil',
            'phone' => '48999992222',
            'email' => 'other@example.com',
            'occupation' => 'Designer',
            'monthly_income' => 3900,
            'household_size' => 1,
            'has_pet' => false,
            'payment_probability' => 'provavel',
            'care_probability' => 'provavel',
            'income_stability_probability' => 'provavel',
            'neighbor_relation_probability' => 'provavel',
            'score' => 75,
        ]);

        $landlord = Landlord::query()->create([
            'name' => 'Locador Teste',
            'email' => 'landlord@example.com',
            'phone' => '48999990000',
        ]);

        $property = Property::query()->create([
            'landlord_id' => $landlord->id,
            'title' => 'Apartamento Centro',
            'city' => 'Florianopolis',
            'state' => 'SC',
            'rent_price' => 2400,
            'bedrooms' => 2,
            'has_garage' => true,
            'property_type' => 'apartamento',
            'description' => 'Apartamento mobiliado',
            'is_active' => true,
        ]);

        $interest = PropertyInterest::query()->create([
            'property_id' => $property->id,
            'prospect_profile_id' => $profile->id,
            'analysis_fee' => 39.9,
            'payment_status' => 'paid',
            'payment_reference' => 'pay-ref-tenant-1',
            'pix_copy_paste' => 'pix-code-tenant-1',
            'landlord_decision' => 'contact_requested',
            'landlord_notes' => 'Perfil aprovado para visita.',
            'contact_requested_at' => now(),
            'contract_ready_at' => now(),
            'paid_at' => now(),
            'profile_access_token' => 'token-tenant',
            'hidden_for_prospect' => false,
        ]);

        VisitSchedule::query()->create([
            'property_interest_id' => $interest->id,
            'property_id' => $property->id,
            'landlord_id' => $landlord->id,
            'scheduled_for' => now()->addDays(2),
            'status' => 'confirmed',
            'mode' => 'presencial',
            'operator_name' => 'Equipe Aluguel Seguro',
        ]);

        $contract = Contract::query()->create([
            'property_id' => $property->id,
            'landlord_id' => $landlord->id,
            'tenant_id' => Tenant::query()->where('email', 'tenant@example.com')->value('id'),
            'property_interest_id' => $interest->id,
            'start_date' => now()->toDateString(),
            'end_date' => now()->addYear()->toDateString(),
            'rent_amount' => 2400,
            'deposit_amount' => 2400,
            'status' => 'draft',
            'contract_text' => 'Contrato de teste',
        ]);

        PaymentSlip::query()->create([
            'contract_id' => $contract->id,
            'due_date' => now()->addMonth()->toDateString(),
            'amount' => 2400,
            'status' => 'pending',
            'description' => 'Aluguel mensal',
        ]);

        PropertyInterest::query()->create([
            'property_id' => $property->id,
            'prospect_profile_id' => $profile->id,
            'analysis_fee' => 39.9,
            'payment_status' => 'paid',
            'payment_reference' => 'pay-ref-hidden-1',
            'pix_copy_paste' => 'pix-code-hidden-1',
            'hidden_for_prospect' => true,
            'profile_access_token' => 'hidden-token',
        ]);

        PropertyInterest::query()->create([
            'property_id' => $property->id,
            'prospect_profile_id' => $otherProfile->id,
            'analysis_fee' => 39.9,
            'payment_status' => 'paid',
            'payment_reference' => 'pay-ref-other-1',
            'pix_copy_paste' => 'pix-code-other-1',
            'profile_access_token' => 'other-token',
        ]);

        Sanctum::actingAs($user);

        $response = $this->getJson('/api/v1/tenant/interests');

        $response
            ->assertOk()
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.property.title', 'Apartamento Centro')
            ->assertJsonPath('data.0.landlord_decision', 'contact_requested')
            ->assertJsonPath('data.0.visit.status', 'confirmed')
            ->assertJsonPath('data.0.contract.status', 'draft')
            ->assertJsonPath('data.0.contract.payment_slips.0.status', 'pending');
    }

    public function test_landlord_cannot_access_tenant_interest_endpoint(): void
    {
        $user = User::factory()->create([
            'email' => 'landlord@example.com',
            'account_type' => 'landlord',
        ]);

        Sanctum::actingAs($user);

        $this->getJson('/api/v1/tenant/interests')
            ->assertForbidden()
            ->assertJsonPath('message', 'Acesso restrito a inquilinos.');
    }
}
