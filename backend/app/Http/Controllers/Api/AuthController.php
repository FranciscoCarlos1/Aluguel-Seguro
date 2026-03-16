<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\AuthLoginRequest;
use App\Http\Requests\AuthRegisterRequest;
use App\Models\Landlord;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    public function register(AuthRegisterRequest $request)
    {
        $data = $request->validated();

        [$user, $landlord] = DB::transaction(function () use ($data) {
            $user = User::create([
                'name' => $data['name'],
                'email' => $data['email'],
                'account_type' => $data['account_type'],
                'password' => Hash::make($data['password']),
            ]);

            $landlord = null;

            if ($data['account_type'] === 'landlord') {
                $landlord = Landlord::firstOrNew(['email' => $data['email']]);
                if (!$landlord->exists) {
                    $landlord->created_by = $data['email'];
                }

                $landlord->fill([
                    'name' => $data['name'],
                    'phone' => $data['phone'],
                    'status' => $landlord->status ?: 'active',
                    'updated_by' => $data['email'],
                ]);
                $landlord->save();
                $landlord = $landlord->fresh();
            }

            return [$user, $landlord];
        });

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user,
            'landlord' => $landlord,
            'token' => $token,
        ], 201);
    }

    public function login(AuthLoginRequest $request)
    {
        $data = $request->validated();

        $user = User::where('email', $data['email'])->first();

        if (!$user || !Hash::check($data['password'], $user->password)) {
            return response()->json(['message' => 'Credenciais invalidas.'], 422);
        }

        $token = $user->createToken('api')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
        ]);
    }

    public function logout()
    {
        $user = auth()->user();

        if ($user?->currentAccessToken()) {
            $user->currentAccessToken()->delete();
        }

        return response()->json(['message' => 'Sessao encerrada.']);
    }
}
