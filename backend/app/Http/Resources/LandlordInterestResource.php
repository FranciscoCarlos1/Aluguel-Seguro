<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LandlordInterestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'analysis_fee' => $this->analysis_fee,
            'payment_status' => $this->payment_status,
            'payment_reference' => $this->payment_reference,
            'landlord_decision' => $this->landlord_decision,
            'landlord_notes' => $this->landlord_notes,
            'hidden_for_prospect' => $this->hidden_for_prospect,
            'paid_at' => $this->paid_at,
            'contact_requested_at' => $this->contact_requested_at,
            'rejected_at' => $this->rejected_at,
            'contract_ready_at' => $this->contract_ready_at,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'property' => new PropertyResource($this->whenLoaded('property')),
            'profile' => new ProspectProfileResource($this->whenLoaded('profile')),
            'visit' => new VisitScheduleResource($this->whenLoaded('visit')),
            'contract' => $this->whenLoaded('contract', function () {
                return [
                    'id' => $this->contract?->id,
                    'status' => $this->contract?->status,
                    'start_date' => $this->contract?->start_date,
                    'rent_amount' => $this->contract?->rent_amount,
                    'payment_slips' => PaymentSlipResource::collection($this->contract?->paymentSlips ?? collect()),
                ];
            }),
        ];
    }
}
