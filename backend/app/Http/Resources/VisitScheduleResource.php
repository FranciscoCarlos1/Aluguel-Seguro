<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class VisitScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'property_interest_id' => $this->property_interest_id,
            'property_id' => $this->property_id,
            'landlord_id' => $this->landlord_id,
            'scheduled_for' => $this->scheduled_for,
            'status' => $this->status,
            'mode' => $this->mode,
            'operator_name' => $this->operator_name,
            'notes' => $this->notes,
            'created_at' => $this->created_at,
            'interest' => new LandlordInterestResource($this->whenLoaded('interest')),
            'property' => new PropertyResource($this->whenLoaded('property')),
        ];
    }
}
