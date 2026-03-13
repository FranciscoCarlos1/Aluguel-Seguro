<?php

namespace Database\Seeders;

use App\Models\Landlord;
use App\Models\Property;
use App\Models\User;
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

        User::factory()->create([
            'name' => 'Test User',
            'email' => 'test@example.com',
        ]);

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
                'title' => 'Apartamento 2 quartos no Centro',
                'city' => 'Florianopolis',
                'state' => 'SC',
                'rent_price' => 2200,
                'bedrooms' => 2,
                'has_garage' => true,
                'property_type' => 'apartamento',
                'description' => 'Apartamento bem localizado, perto de comercio e transporte.',
                'address_neighborhood' => 'Centro',
                'is_active' => true,
            ],
            [
                'title' => 'Casa em condominio com 3 quartos',
                'city' => 'Sao Jose',
                'state' => 'SC',
                'rent_price' => 3400,
                'bedrooms' => 3,
                'has_garage' => true,
                'property_type' => 'casa_condominio',
                'description' => 'Casa segura com area de lazer e portaria.',
                'address_neighborhood' => 'Kobrasol',
                'is_active' => true,
            ],
            [
                'title' => 'Kitnet compacta para estudante',
                'city' => 'Blumenau',
                'state' => 'SC',
                'rent_price' => 950,
                'bedrooms' => 1,
                'has_garage' => false,
                'property_type' => 'kitnet',
                'description' => 'Ideal para quem busca praticidade e baixo custo.',
                'address_neighborhood' => 'Garcia',
                'is_active' => true,
            ],
            [
                'title' => 'Casa com patio e garagem',
                'city' => 'Joinville',
                'state' => 'SC',
                'rent_price' => 1800,
                'bedrooms' => 2,
                'has_garage' => true,
                'property_type' => 'casa',
                'description' => 'Casa arejada com espaco externo para familia.',
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
    }
}
