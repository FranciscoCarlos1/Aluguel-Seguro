<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProspectProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'phone' => $this->phone,
            'email' => $this->email,
            'occupation' => $this->occupation,
            'monthly_income' => $this->monthly_income,
            'household_size' => $this->household_size,
            'has_pet' => $this->has_pet,
            'rental_reason' => $this->rental_reason,
            'additional_notes' => $this->additional_notes,
            'payment_probability' => $this->payment_probability,
            'care_probability' => $this->care_probability,
            'income_stability_probability' => $this->income_stability_probability,
            'neighbor_relation_probability' => $this->neighbor_relation_probability,
            'score' => $this->score,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
