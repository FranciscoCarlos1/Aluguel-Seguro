<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTenantRequest;
use App\Http\Requests\UpdateTenantRequest;
use App\Models\Tenant;
use App\Http\Resources\TenantResource;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->query('search');
        $sort = $request->query('sort');
        $perPage = min((int) $request->query('per_page', 10), 50);

        $tenants = Tenant::query()
            ->when($search, function ($query, string $search) {
                $query->where('full_name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('cpf', 'like', "%{$search}%")
                    ->orWhere('rg', 'like', "%{$search}%");
            })
            ->when($sort === 'score_desc', function ($query) {
                $query->orderByDesc('score');
            }, function ($query) {
                $query->orderByDesc('created_at');
            })
            ->paginate($perPage);

        return TenantResource::collection($tenants);
    }

    public function store(StoreTenantRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] ??= $request->user()?->email;
        $data['updated_by'] ??= $request->user()?->email;

        $tenant = Tenant::create($data);

        return (new TenantResource($tenant))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Tenant $tenant)
    {
        $tenant->load(['profile', 'reviews']);

        return new TenantResource($tenant);
    }

    public function update(UpdateTenantRequest $request, Tenant $tenant)
    {
        $data = $request->validated();
        $data['updated_by'] ??= $request->user()?->email;

        $tenant->update($data);

        return new TenantResource($tenant->fresh());
    }
}
