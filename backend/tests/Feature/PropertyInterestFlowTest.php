<?php

namespace Tests\Feature;

use App\Models\Landlord;
use App\Models\Property;
use App\Models\PropertyInterest;
use App\Models\ProspectProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class PropertyInterestFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_first_interest_requires_complete_behavioral_questionnaire(): void
    {
        $property = $this->createProperty();

        $response = $this->postJson("/api/v1/properties/{$property->id}/interests", [
            'tenant_name' => 'Carlos Souza',
            'tenant_phone' => '48999998888',
            'has_pet' => false,
            'care_reflection' => 'concordo_totalmente',
            'quiet_refuge' => 'concordo',
        ]);

        $response
            ->assertStatus(422)
            ->assertJsonPath('message', 'Para o primeiro interesse, responda o questionario comportamental completo.');
    }

    public function test_rejected_property_is_hidden_for_same_prospect_phone(): void
    {
        $property = $this->createProperty();
        $profile = ProspectProfile::create([
            'full_name' => 'Ana Lima',
            'phone' => '48977776666',
            'email' => 'ana@example.com',
            'occupation' => 'Operadora de producao',
            'monthly_income' => 2800,
            'household_size' => 3,
            'has_pet' => false,
            'rental_reason' => 'Mudanca para SC',
            'additional_notes' => 'Perfil salvo para analise.',
            'behavioral_answers' => [
                'care_reflection' => 'concordo_totalmente',
                'quiet_refuge' => 'concordo',
                'financial_commitment' => 'discordo_totalmente',
                'stability_focus' => 'concordo_totalmente',
                'visitors_sharing' => 'discordo',
                'rule_respect' => 'concordo',
                'preventive_maintenance' => 'concordo_totalmente',
            ],
            'payment_probability' => 'muito_provavel',
            'care_probability' => 'muito_provavel',
            'income_stability_probability' => 'muito_provavel',
            'neighbor_relation_probability' => 'provavel',
            'score' => 91,
        ]);

        $interest = PropertyInterest::create([
            'property_id' => $property->id,
            'prospect_profile_id' => $profile->id,
            'analysis_fee' => 4.99,
            'payment_status' => 'paid',
            'payment_reference' => 'PIX-TESTE-0001',
            'pix_copy_paste' => 'PIX',
            'pix_qr_payload' => 'PIX',
            'profile_access_token' => 'token-teste-1',
            'hidden_for_prospect' => true,
            'landlord_decision' => 'rejected',
            'rejected_at' => now(),
        ]);

        $user = User::factory()->create([
            'email' => 'locador@example.com',
        ]);
        Sanctum::actingAs($user);

        $landlord = Landlord::create([
            'name' => 'Locador Demo',
            'email' => 'locador@example.com',
            'phone' => '48966665555',
            'status' => 'active',
        ]);

        $property->update(['landlord_id' => $landlord->id]);
        $interest->update(['property_id' => $property->id]);

        $this->getJson('/api/v1/properties?prospect_phone=48977776666')
            ->assertOk()
            ->assertJsonCount(0, 'data');

        $this->getJson("/api/v1/properties/{$property->id}?prospect_phone=48977776666")
            ->assertStatus(404);
    }

    private function createProperty(): Property
    {
        $landlord = Landlord::create([
            'name' => 'Locador Demo',
            'email' => 'proprietario@example.com',
            'phone' => '48999990000',
            'status' => 'active',
        ]);

        return Property::create([
            'landlord_id' => $landlord->id,
            'title' => 'Apartamento funcional em Joinville',
            'city' => 'Joinville',
            'state' => 'SC',
            'rent_price' => 1800,
            'bedrooms' => 2,
            'has_garage' => true,
            'property_type' => 'apartamento',
            'description' => 'Imovel com foco em rotina familiar e contrato simples.',
            'address_neighborhood' => 'Saguacu',
            'is_active' => true,
        ]);
    }
}
