<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTenantProfileRequest;
use App\Http\Resources\TenantProfileResource;
use App\Models\Tenant;
use App\Models\TenantProfile;

class TenantProfileController extends Controller
{
    public function show(Tenant $tenant)
    {
        $profile = $tenant->profile;

        if (!$profile) {
            return response()->json(['message' => 'Perfil nao encontrado.'], 404);
        }

        return new TenantProfileResource($profile);
    }

    public function store(StoreTenantProfileRequest $request, Tenant $tenant)
    {
        $data = $request->validated();
        $data['created_by'] ??= $request->user()?->email;
        $data['updated_by'] ??= $request->user()?->email;

        if (!empty($data['consent_at']) && empty($data['consent_ip'])) {
            $data['consent_ip'] = $request->ip();
        }

        $profile = TenantProfile::updateOrCreate(
            ['tenant_id' => $tenant->id],
            $data
        );

        return (new TenantProfileResource($profile))
            ->response()
            ->setStatusCode(201);
    }
}
