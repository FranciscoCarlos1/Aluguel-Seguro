<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTenantReviewRequest;
use App\Http\Resources\TenantReviewResource;
use App\Models\Landlord;
use App\Models\Tenant;
use App\Models\TenantProfile;
use App\Models\TenantReview;

class TenantReviewController extends Controller
{
    public function index(Tenant $tenant)
    {
        $reviews = $tenant->reviews()->with('landlord')->latest()->get();

        return TenantReviewResource::collection($reviews);
    }

    public function store(StoreTenantReviewRequest $request, Tenant $tenant)
    {
        $data = $request->validated();
        $data['created_by'] ??= $request->user()?->email;
        $data['updated_by'] ??= $request->user()?->email;

        $landlordId = null;
        if ($request->user()?->email) {
            $landlordId = Landlord::query()
                ->where('email', $request->user()->email)
                ->value('id');
        }

        if (!$landlordId) {
            return response()->json([
                'message' => 'Locador precisa estar cadastrado para avaliar.',
            ], 403);
        }

        $data['landlord_id'] = $landlordId;

        $review = TenantReview::create([
            'tenant_id' => $tenant->id,
            ...$data,
        ]);

        $review->load('landlord');

        $score = $this->calculateTenantScore($tenant);
        $tenant->update([
            'score' => $score,
            'updated_by' => $request->user()?->email,
        ]);
        TenantProfile::updateOrCreate(
            ['tenant_id' => $tenant->id],
            [
                'score' => $score,
                'status' => 'active',
                'updated_by' => $request->user()?->email,
            ]
        );

        return (new TenantReviewResource($review))
            ->response()
            ->setStatusCode(201);
    }

    private function calculateTenantScore(Tenant $tenant): int
    {
        $reviews = $tenant->reviews()->get();
        if ($reviews->isEmpty()) {
            return 0;
        }

        $scores = $reviews->map(fn (TenantReview $review) => $this->scoreReview($review));

        return (int) round($scores->average());
    }

    private function scoreReview(TenantReview $review): int
    {
        $base = ($review->rating ? ($review->rating / 5) : 0) * 70;

        $payment = match ($review->payment_history) {
            'on_time' => 10,
            'late' => -10,
            'defaulted' => -25,
            default => 0,
        };

        $neighbors = match ($review->neighbor_relations) {
            'good' => 5,
            'average' => 0,
            'bad' => -5,
            default => 0,
        };

        $care = match ($review->property_care) {
            'good' => 5,
            'average' => 0,
            'bad' => -5,
            default => 0,
        };

        $noise = match ($review->noise_level) {
            'low' => 5,
            'medium' => 0,
            'high' => -5,
            default => 0,
        };

        $rentAgain = match ($review->would_rent_again) {
            'yes' => 10,
            'no' => -10,
            default => 0,
        };

        $score = (int) round($base + $payment + $neighbors + $care + $noise + $rentAgain);

        return max(0, min(100, $score));
    }
}
