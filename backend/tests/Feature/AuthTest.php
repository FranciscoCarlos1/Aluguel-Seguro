<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_register_and_login(): void
    {
        $registerPayload = [
            'name' => 'Locador Demo',
            'email' => 'locador@example.com',
            'password' => 'SenhaForte123',
            'password_confirmation' => 'SenhaForte123',
        ];

        $registerResponse = $this->postJson('/api/v1/auth/register', $registerPayload);

        $registerResponse
            ->assertStatus(201)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'token',
            ]);

        $loginResponse = $this->postJson('/api/v1/auth/login', [
            'email' => 'locador@example.com',
            'password' => 'SenhaForte123',
        ]);

        $loginResponse
            ->assertStatus(200)
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'token',
            ]);
    }
}
