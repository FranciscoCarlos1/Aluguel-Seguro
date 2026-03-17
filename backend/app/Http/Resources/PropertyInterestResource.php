<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyInterestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'prospect_profile_id' => $this->prospect_profile_id,
            'analysis_fee' => $this->analysis_fee,
            'payment_status' => $this->payment_status,
            'payment_reference' => $this->payment_reference,
            'pix_copy_paste' => $this->pix_copy_paste,
            'pix_qr_payload' => $this->pix_qr_payload,
            'paid_at' => $this->paid_at,
            'profile_access_token' => $this->profile_access_token,
            'central_notified_at' => $this->central_notified_at,
            'landlord_decision' => $this->landlord_decision,
            'landlord_notes' => $this->landlord_notes,
            'hidden_for_prospect' => $this->hidden_for_prospect,
            'contact_requested_at' => $this->contact_requested_at,
            'rejected_at' => $this->rejected_at,
            'contract_ready_at' => $this->contract_ready_at,
            'created_at' => $this->created_at,
            'profile' => new ProspectProfileResource($this->whenLoaded('profile')),
            'property' => new PropertyResource($this->whenLoaded('property')),
            'visit' => $this->whenLoaded('visit', function () {
                if (!$this->visit) {
                    return null;
                }

                return [
                    'id' => $this->visit->id,
                    'scheduled_for' => $this->visit->scheduled_for,
                    'status' => $this->visit->status,
                    'mode' => $this->visit->mode,
                    'operator_name' => $this->visit->operator_name,
                    'notes' => $this->visit->notes,
                ];
            }),
            'contract' => $this->whenLoaded('contract', function () {
                if (!$this->contract) {
                    return null;
                }

                return [
                    'id' => $this->contract->id,
                    'status' => $this->contract->status,
                    'start_date' => $this->contract->start_date,
                    'end_date' => $this->contract->end_date,
                    'rent_amount' => $this->contract->rent_amount,
                    'deposit_amount' => $this->contract->deposit_amount,
                    'signed_at' => $this->contract->signed_at,
                    'payment_slips' => $this->contract->relationLoaded('paymentSlips')
                        ? $this->contract->paymentSlips
                            ->map(fn ($slip) => [
                                'id' => $slip->id,
                                'due_date' => $slip->due_date,
                                'amount' => $slip->amount,
                                'status' => $slip->status,
                                'payment_link' => $slip->payment_link,
                                'pdf_url' => $slip->pdf_url,
                            ])
                            ->values()
                        : [],
                ];
            }),
        ];
    }
}
