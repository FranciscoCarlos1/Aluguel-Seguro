<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use App\Models\Landlord;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_login(): void
    {
        $registerPayload = [
            'name' => 'Locador Demo',
            'email' => 'locador@example.com',
            'account_type' => 'landlord',
            'phone' => '48999990000',
            'password' => 'SenhaForte123',
            'password_confirmation' => 'SenhaForte123',
        ];

        $registerResponse = $this->postJson('/api/v1/auth/register', $registerPayload);

        $registerResponse
            ->assertStatus(201)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'account_type'],
                'token',
            ]);

        $this->assertDatabaseHas('landlords', ['email' => 'locador@example.com']);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'locador@example.com',
            'password' => 'SenhaForte123',
        ]);

        $loginResponse
            ->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'account_type'],
                'token',
            ]);
    }

    public function test_tenant_can_register_without_creating_landlord_record(): void
    {
        $registerResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Inquilino Demo',
            'email' => 'inquilino@example.com',
            'account_type' => 'tenant',
            'phone' => '48999991111',
            'password' => 'SenhaForte123',
            'password_confirmation' => 'SenhaForte123',
        ]);

        $registerResponse
            ->assertStatus(201)
            ->assertJsonPath('user.account_type', 'tenant')
            ->assertJsonPath('landlord', null);

        $this->assertDatabaseMissing('landlords', ['email' => 'inquilino@example.com']);
    }
}
