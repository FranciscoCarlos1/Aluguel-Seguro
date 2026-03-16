<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ProspectProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $reviewDueAt = $this->updated_at?->copy()->addMonths(3);

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
            'behavioral_answers' => $this->behavioral_answers,
            'behavioral_summary' => \App\Models\ProspectProfile::summarizeBehavioralAnswers($this->behavioral_answers),
            'payment_probability' => $this->payment_probability,
            'care_probability' => $this->care_probability,
            'income_stability_probability' => $this->income_stability_probability,
            'neighbor_relation_probability' => $this->neighbor_relation_probability,
            'score' => $this->score,
            'review_due_at' => $reviewDueAt,
            'can_refresh_questionnaire' => $reviewDueAt ? now()->greaterThanOrEqualTo($reviewDueAt) : true,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
