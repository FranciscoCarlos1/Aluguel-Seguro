<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SupportTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'landlord_id' => $this->landlord_id,
            'name' => $this->name,
            'phone' => $this->phone,
            'topic' => $this->topic,
            'preferred_time' => $this->preferred_time,
            'notes' => $this->notes,
            'status' => $this->status,
            'contact_channel' => $this->contact_channel,
            'responded_at' => $this->responded_at,
            'created_at' => $this->created_at,
        ];
    }
}
