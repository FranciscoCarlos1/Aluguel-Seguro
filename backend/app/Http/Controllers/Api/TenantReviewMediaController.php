<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TenantReview;
use App\Models\TenantReviewMedia;
use Illuminate\Http\Request;

class TenantReviewMediaController extends Controller
{
    public function store(Request $request, TenantReview $review)
    {
        $data = $request->validate([
            'media_type' => 'required|in:photo,video',
            'url' => 'required|url',
        ]);
        $media = $review->media()->create($data);
        return response()->json(['media' => $media], 201);
    }

    public function destroy(TenantReview $review, TenantReviewMedia $media)
    {
        if ($media->tenant_review_id !== $review->id) {
            return response()->json(['message' => 'Mídia não pertence à avaliação.'], 403);
        }
        $media->delete();
        return response()->json(['message' => 'Mídia removida.']);
    }
}
