<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyInterestResource;
use App\Models\PropertyInterest;
use App\Models\ProspectProfile;
use App\Models\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantInterestController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        if (($user->account_type ?? null) !== 'tenant') {
            return response()->json([
                'message' => 'Acesso restrito a inquilinos.',
            ], 403);
        }

        $phones = Tenant::query()
            ->where('email', $user->email)
            ->pluck('phone')
            ->map(fn ($phone) => preg_replace('/\D+/', '', (string) $phone))
            ->filter()
            ->unique()
            ->values();

        $profileIds = ProspectProfile::query()
            ->where(function ($query) use ($user, $phones): void {
                $query->where('email', $user->email);

                if ($phones->isNotEmpty()) {
                    $query->orWhereIn('phone', $phones->all());
                }
            })
            ->pluck('id');

        if ($profileIds->isEmpty()) {
            return response()->json([
                'data' => [],
            ]);
        }

        $interests = PropertyInterest::query()
            ->with(['property.landlord', 'profile', 'visit', 'contract.paymentSlips'])
            ->whereIn('prospect_profile_id', $profileIds)
            ->where('hidden_for_prospect', false)
            ->latest()
            ->get();

        return response()->json([
            'data' => PropertyInterestResource::collection($interests)->resolve(),
        ]);
    }
}
