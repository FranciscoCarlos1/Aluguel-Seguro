<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantReviewResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'rating' => $this->rating,
            'payment_history' => $this->payment_history,
            'stay_duration_months' => $this->stay_duration_months,
            'neighbor_relations' => $this->neighbor_relations,
            'property_care' => $this->property_care,
            'noise_level' => $this->noise_level,
            'would_rent_again' => $this->would_rent_again,
            'comment' => $this->comment,
            'landlord_name' => $this->landlord?->name,
            'created_by_name' => $this->created_by_name,
            'created_by_role' => $this->created_by_role,
            'created_at' => $this->created_at,
        ];
    }
}
