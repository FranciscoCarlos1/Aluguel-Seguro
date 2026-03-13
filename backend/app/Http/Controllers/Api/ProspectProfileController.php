<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\ProspectProfileResource;
use App\Models\PropertyInterest;
use App\Models\ProspectProfile;
use Illuminate\Http\Request;

class ProspectProfileController extends Controller
{
    public function lookup(Request $request)
    {
        $phone = preg_replace('/\D+/', '', (string) $request->query('phone'));
        if (!$phone) {
            return response()->json(['exists' => false]);
        }

        $profile = ProspectProfile::where('phone', $phone)->first();
        if (!$profile) {
            return response()->json(['exists' => false]);
        }

        return response()->json([
            'exists' => true,
            'profile' => new ProspectProfileResource($profile),
        ]);
    }

    public function access(string $token)
    {
        $interest = PropertyInterest::query()
            ->with(['profile', 'property'])
            ->where('profile_access_token', $token)
            ->first();

        if (!$interest) {
            return response()->json(['message' => 'Token invalido.'], 404);
        }

        if ($interest->payment_status !== 'paid') {
            return response()->json(['message' => 'Pagamento da taxa de analise pendente.'], 402);
        }

        return response()->json([
            'property' => [
                'id' => $interest->property?->id,
                'title' => $interest->property?->title,
            ],
            'profile' => new ProspectProfileResource($interest->profile),
        ]);
    }
}
