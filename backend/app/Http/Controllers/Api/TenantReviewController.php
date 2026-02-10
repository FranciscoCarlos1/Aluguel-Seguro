<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTenantReviewRequest;
use App\Http\Resources\TenantReviewResource;
use App\Models\Tenant;
use App\Models\TenantReview;

class TenantReviewController extends Controller
{
    public function index(Tenant $tenant)
    {
        $reviews = $tenant->reviews()->latest()->get();

        return TenantReviewResource::collection($reviews);
    }

    public function store(StoreTenantReviewRequest $request, Tenant $tenant)
    {
        $data = $request->validated();
        $data['created_by'] ??= $request->user()?->email;
        $data['updated_by'] ??= $request->user()?->email;

        $review = TenantReview::create([
            'tenant_id' => $tenant->id,
            ...$data,
        ]);

        return (new TenantReviewResource($review))
            ->response()
            ->setStatusCode(201);
    }
}
