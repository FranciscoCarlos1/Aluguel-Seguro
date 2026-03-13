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
            'created_at' => $this->created_at,
            'profile' => new ProspectProfileResource($this->whenLoaded('profile')),
            'property' => new PropertyResource($this->whenLoaded('property')),
        ];
    }
}
