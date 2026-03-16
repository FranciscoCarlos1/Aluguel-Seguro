<?php

namespace Database\Seeders;

use App\Models\Contract;
use App\Models\Landlord;
use App\Models\PaymentSlip;
use App\Models\Property;
use App\Models\PropertyInterest;
use App\Models\ProspectProfile;
use App\Models\SupportTicket;
use App\Models\Tenant;
use App\Models\User;
use App\Models\VisitSchedule;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // User::factory(10)->create();

        User::query()->updateOrCreate(
            ['email' => 'test@example.com'],
            [
                'name' => 'Test User',
                'password' => bcrypt('password'),
                'email_verified_at' => now(),
            ]
        );

        $landlord = Landlord::firstOrCreate(
            ['email' => 'locador@aluguelseguro.com'],
            [
                'name' => 'Locador Demo',
                'phone' => '48999990000',
                'company_name' => 'Imoveis SC',
                'status' => 'active',
            ]
        );

        $properties = [
            [
                'source_name' => 'seed_demo',
                'source_reference' => 'demo-ap-001',
                'title' => 'Apartamento 2 quartos no Centro',
                'city' => 'Florianopolis',
                'state' => 'SC',
                'rent_price' => 2200,
                'bedrooms' => 2,
                'has_garage' => true,
                'property_type' => 'apartamento',
                'description' => 'Apartamento bem localizado, perto de comercio e transporte.',
                'source_url' => 'https://fonte-autorizada.exemplo/imoveis/demo-ap-001',
                'hero_image_url' => 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80',
                'image_urls' => ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1200&q=80'],
                'address_neighborhood' => 'Centro',
                'is_active' => true,
            ],
            [
                'source_name' => 'seed_demo',
                'source_reference' => 'demo-cd-002',
                'title' => 'Casa em condominio com 3 quartos',
                'city' => 'Sao Jose',
                'state' => 'SC',
                'rent_price' => 3400,
                'bedrooms' => 3,
                'has_garage' => true,
                'property_type' => 'casa_condominio',
                'description' => 'Casa segura com area de lazer e portaria.',
                'source_url' => 'https://fonte-autorizada.exemplo/imoveis/demo-cd-002',
                'hero_image_url' => 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80',
                'image_urls' => ['https://images.unsplash.com/photo-1568605114967-8130f3a36994?auto=format&fit=crop&w=1200&q=80'],
                'address_neighborhood' => 'Kobrasol',
                'is_active' => true,
            ],
            [
                'source_name' => 'seed_demo',
                'source_reference' => 'demo-kit-003',
                'title' => 'Kitnet compacta para estudante',
                'city' => 'Blumenau',
                'state' => 'SC',
                'rent_price' => 950,
                'bedrooms' => 1,
                'has_garage' => false,
                'property_type' => 'kitnet',
                'description' => 'Ideal para quem busca praticidade e baixo custo.',
                'source_url' => 'https://fonte-autorizada.exemplo/imoveis/demo-kit-003',
                'hero_image_url' => 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
                'image_urls' => ['https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80'],
                'address_neighborhood' => 'Garcia',
                'is_active' => true,
            ],
            [
                'source_name' => 'seed_demo',
                'source_reference' => 'demo-cs-004',
                'title' => 'Casa com patio e garagem',
                'city' => 'Joinville',
                'state' => 'SC',
                'rent_price' => 1800,
                'bedrooms' => 2,
                'has_garage' => true,
                'property_type' => 'casa',
                'description' => 'Casa arejada com espaco externo para familia.',
                'source_url' => 'https://fonte-autorizada.exemplo/imoveis/demo-cs-004',
                'hero_image_url' => 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80',
                'image_urls' => ['https://images.unsplash.com/photo-1570129477492-45c003edd2be?auto=format&fit=crop&w=1200&q=80'],
                'address_neighborhood' => 'America',
                'is_active' => true,
            ],
        ];

        foreach ($properties as $item) {
            Property::updateOrCreate(
                [
                    'landlord_id' => $landlord->id,
                    'title' => $item['title'],
                ],
                $item
            );
        }

        $property = Property::where('landlord_id', $landlord->id)->first();

        if (!$property) {
            return;
        }

        $profile = ProspectProfile::updateOrCreate(
            ['email' => 'familia.migrante@example.com'],
            [
                'full_name' => 'Joana e Carlos da Silva',
                'email' => 'familia.migrante@example.com',
                'phone' => '48988887777',
                'occupation' => 'Auxiliar de cozinha e motorista de app',
                'monthly_income' => 4200,
                'household_size' => 4,
                'has_pet' => false,
                'rental_reason' => 'Familia migrante buscando moradia previsivel com burocracia reduzida e entrada rapida.',
                'additional_notes' => 'Preferencia por rotina silenciosa, estabilidade e suporte mediado por telefone e WhatsApp.',
                'payment_probability' => 'muito_provavel',
                'care_probability' => 'muito_provavel',
                'income_stability_probability' => 'provavel',
                'neighbor_relation_probability' => 'provavel',
                'score' => 86,
            ]
        );

        $interest = PropertyInterest::updateOrCreate(
            [
                'property_id' => $property->id,
                'prospect_profile_id' => $profile->id,
            ],
            [
                'analysis_fee' => 4.99,
                'payment_status' => 'paid',
                'payment_reference' => 'PIX-DEMO-INTERESTE',
                'pix_copy_paste' => '000201010212PIXDEMO',
                'pix_qr_payload' => 'PIXDEMO',
                'paid_at' => now()->subDay(),
                'profile_access_token' => 'demo-interest-token',
                'central_notified_at' => now()->subDay(),
                'landlord_decision' => 'contact_requested',
                'landlord_notes' => 'Perfil aprovado para contato e visita inicial.',
                'hidden_for_prospect' => false,
                'contact_requested_at' => now()->subHours(20),
            ]
        );

        VisitSchedule::updateOrCreate(
            ['property_interest_id' => $interest->id],
            [
                'property_id' => $property->id,
                'landlord_id' => $landlord->id,
                'scheduled_for' => now()->addDays(2)->setTime(15, 0),
                'status' => 'requested',
                'mode' => 'presencial',
                'operator_name' => 'Equipe Aluguel Seguro',
                'notes' => 'Aguardando confirmacao do melhor horario para a familia.',
                'created_by' => 'seeder',
            ]
        );

        $tenant = Tenant::updateOrCreate(
            ['email' => $profile->email],
            [
                'full_name' => $profile->full_name,
                'email' => $profile->email,
                'phone' => $profile->phone,
                'occupation' => $profile->occupation,
                'monthly_income' => $profile->monthly_income,
                'score' => $profile->score,
                'document_last4' => '7777',
                'notes' => 'Inquilino demo criado para demonstracao do contrato.',
                'status' => 'active',
                'created_by' => 'seeder',
                'updated_by' => 'seeder',
            ]
        );

        $contract = Contract::updateOrCreate(
            ['property_interest_id' => $interest->id],
            [
                'property_id' => $property->id,
                'landlord_id' => $landlord->id,
                'tenant_id' => $tenant->id,
                'start_date' => now()->addDays(7)->toDateString(),
                'end_date' => now()->addYear()->toDateString(),
                'rent_amount' => $property->rent_price,
                'deposit_amount' => $property->rent_price,
                'fire_insurance' => 38.50,
                'garbage_fee' => 21.50,
                'status' => 'draft',
                'contract_text' => 'Contrato demo gerado automaticamente para apresentacao do portal.',
            ]
        );

        PaymentSlip::updateOrCreate(
            [
                'contract_id' => $contract->id,
                'bank_slip_number' => 'SLIP-DEMO-001',
            ],
            [
                'due_date' => now()->addDays(7)->toDateString(),
                'amount' => 30.00,
                'status' => 'pending',
                'bank_code' => '001',
                'pdf_url' => null,
                'payment_link' => null,
                'description' => 'Taxa de lixo e seguro incendio - parcela 1',
                'installment_number' => 1,
                'installment_total' => 2,
                'fine' => 0,
                'interest' => 0,
            ]
        );

        PaymentSlip::updateOrCreate(
            [
                'contract_id' => $contract->id,
                'bank_slip_number' => 'SLIP-DEMO-002',
            ],
            [
                'due_date' => now()->addDays(37)->toDateString(),
                'amount' => 30.00,
                'status' => 'pending',
                'bank_code' => '001',
                'pdf_url' => null,
                'payment_link' => null,
                'description' => 'Taxa de lixo e seguro incendio - parcela 2',
                'installment_number' => 2,
                'installment_total' => 2,
                'fine' => 0,
                'interest' => 0,
            ]
        );

        SupportTicket::updateOrCreate(
            [
                'landlord_id' => $landlord->id,
                'topic' => 'Regularizacao de contrato e secretaria mensal',
            ],
            [
                'name' => $landlord->name,
                'phone' => $landlord->phone,
                'preferred_time' => 'Apos as 18h',
                'notes' => 'Interesse no pacote mensal de secretaria por R$ 49,99 e duvidas sobre comprovantes.',
                'status' => 'Recebido pela equipe',
                'contact_channel' => 'telefone_e_whatsapp',
                'created_by' => 'seeder',
            ]
        );
    }
}
