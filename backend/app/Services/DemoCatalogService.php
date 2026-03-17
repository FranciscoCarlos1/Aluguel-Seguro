<?php

namespace App\Services;

use App\Models\Landlord;
use App\Models\Property;
use Illuminate\Support\Facades\Schema;

class DemoCatalogService
{
    public function ensureCatalogAvailable(): int
    {
        if (!Schema::hasTable('properties') || Property::query()->exists()) {
            return 0;
        }

        $landlord = Landlord::firstOrCreate(
            ['email' => 'locador@aluguelseguro.com'],
            [
                'name' => 'Locador Demo',
                'phone' => '48999990000',
                'company_name' => 'Imoveis SC',
                'status' => 'active',
            ]
        );

        $created = 0;

        foreach ($this->demoProperties() as $item) {
            $property = Property::updateOrCreate(
                Property::importLookupAttributes($landlord->id, $item),
                Property::persistableAttributes([
                    ...$item,
                    'landlord_id' => $landlord->id,
                ])
            );

            if ($property->wasRecentlyCreated) {
                $created++;
            }
        }

        return $created;
    }

    public function demoProperties(): array
    {
        return [
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
            [
                'source_name' => 'seed_demo',
                'source_reference' => 'demo-ap-005',
                'title' => 'Apartamento mobiliado perto da UFSC',
                'city' => 'Florianopolis',
                'state' => 'SC',
                'rent_price' => 2600,
                'bedrooms' => 2,
                'has_garage' => false,
                'property_type' => 'apartamento',
                'description' => 'Apartamento pronto para morar, ideal para casal ou estudantes com rotina tranquila.',
                'source_url' => 'https://fonte-autorizada.exemplo/imoveis/demo-ap-005',
                'hero_image_url' => 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80',
                'image_urls' => ['https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=80'],
                'address_neighborhood' => 'Trindade',
                'is_active' => true,
            ],
            [
                'source_name' => 'seed_demo',
                'source_reference' => 'demo-kt-006',
                'title' => 'Kitnet funcional com contas acessiveis',
                'city' => 'Sao Jose',
                'state' => 'SC',
                'rent_price' => 1100,
                'bedrooms' => 1,
                'has_garage' => false,
                'property_type' => 'kitnet',
                'description' => 'Espaco compacto, iluminado e com facil acesso a comercio e transporte publico.',
                'source_url' => 'https://fonte-autorizada.exemplo/imoveis/demo-kt-006',
                'hero_image_url' => 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
                'image_urls' => ['https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80'],
                'address_neighborhood' => 'Campinas',
                'is_active' => true,
            ],
            [
                'source_name' => 'seed_demo',
                'source_reference' => 'demo-cd-007',
                'title' => 'Casa em condominio com escritorio',
                'city' => 'Palhoca',
                'state' => 'SC',
                'rent_price' => 3900,
                'bedrooms' => 3,
                'has_garage' => true,
                'property_type' => 'casa_condominio',
                'description' => 'Casa pensada para familia e home office, com area gourmet e seguranca 24h.',
                'source_url' => 'https://fonte-autorizada.exemplo/imoveis/demo-cd-007',
                'hero_image_url' => 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
                'image_urls' => ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80'],
                'address_neighborhood' => 'Pedra Branca',
                'is_active' => true,
            ],
            [
                'source_name' => 'seed_demo',
                'source_reference' => 'demo-cs-008',
                'title' => 'Casa terrea com quintal amplo',
                'city' => 'Blumenau',
                'state' => 'SC',
                'rent_price' => 2300,
                'bedrooms' => 2,
                'has_garage' => true,
                'property_type' => 'casa',
                'description' => 'Casa terrea arejada, ideal para quem quer silencio, espaco externo e vizinhanca residencial.',
                'source_url' => 'https://fonte-autorizada.exemplo/imoveis/demo-cs-008',
                'hero_image_url' => 'https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1200&q=80',
                'image_urls' => ['https://images.unsplash.com/photo-1448630360428-65456885c650?auto=format&fit=crop&w=1200&q=80'],
                'address_neighborhood' => 'Itoupava Norte',
                'is_active' => true,
            ],
            [
                'source_name' => 'seed_demo',
                'source_reference' => 'demo-ap-009',
                'title' => 'Apartamento com sacada e vaga coberta',
                'city' => 'Joinville',
                'state' => 'SC',
                'rent_price' => 2100,
                'bedrooms' => 2,
                'has_garage' => true,
                'property_type' => 'apartamento',
                'description' => 'Apartamento com boa ventilacao, sacada e condominio organizado para rotina familiar.',
                'source_url' => 'https://fonte-autorizada.exemplo/imoveis/demo-ap-009',
                'hero_image_url' => 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80',
                'image_urls' => ['https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'],
                'address_neighborhood' => 'Atiradores',
                'is_active' => true,
            ],
            [
                'source_name' => 'seed_demo',
                'source_reference' => 'demo-ap-010',
                'title' => 'Apartamento compacto para entrada rapida',
                'city' => 'Criciuma',
                'state' => 'SC',
                'rent_price' => 1450,
                'bedrooms' => 1,
                'has_garage' => true,
                'property_type' => 'apartamento',
                'description' => 'Imovel enxuto com burocracia reduzida, ideal para quem acabou de chegar ao estado.',
                'source_url' => 'https://fonte-autorizada.exemplo/imoveis/demo-ap-010',
                'hero_image_url' => 'https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80',
                'image_urls' => ['https://images.unsplash.com/photo-1460317442991-0ec209397118?auto=format&fit=crop&w=1200&q=80'],
                'address_neighborhood' => 'Pio Correa',
                'is_active' => true,
            ],
        ];
    }
}