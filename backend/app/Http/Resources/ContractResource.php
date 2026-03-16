<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ContractResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_id' => $this->property_id,
            'landlord_id' => $this->landlord_id,
            'tenant_id' => $this->tenant_id,
            'property_interest_id' => $this->property_interest_id,
            'start_date' => $this->start_date,
            'end_date' => $this->end_date,
            'rent_amount' => $this->rent_amount,
            'deposit_amount' => $this->deposit_amount,
            'fire_insurance' => $this->fire_insurance,
            'garbage_fee' => $this->garbage_fee,
            'status' => $this->status,
            'contract_text' => $this->contract_text,
            'signed_at' => $this->signed_at,
            'signed_by_ip' => $this->signed_by_ip,
            'signature_hash' => $this->signature_hash,
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
            'property' => new PropertyResource($this->whenLoaded('property')),
            'landlord' => $this->whenLoaded('landlord', function () {
                return [
                    'id' => $this->landlord?->id,
                    'name' => $this->landlord?->name,
                    'email' => $this->landlord?->email,
                    'phone' => $this->landlord?->phone,
                ];
            }),
            'tenant' => $this->whenLoaded('tenant', function () {
                return [
                    'id' => $this->tenant?->id,
                    'full_name' => $this->tenant?->full_name,
                    'email' => $this->tenant?->email,
                    'phone' => $this->tenant?->phone,
                    'occupation' => $this->tenant?->occupation,
                    'monthly_income' => $this->tenant?->monthly_income,
                ];
            }),
            'payment_slips' => PaymentSlipResource::collection($this->whenLoaded('paymentSlips')),
        ];
    }
}