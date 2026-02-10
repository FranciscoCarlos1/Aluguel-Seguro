<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantProfileResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'summary_text' => $this->summary_text,
            'references_text' => $this->references_text,
            'notes' => $this->notes,
            'score' => $this->score,
            'status' => $this->status,
            'consent_at' => $this->consent_at,
            'consent_source' => $this->consent_source,
            'data_retention_until' => $this->data_retention_until,
            'created_at' => $this->created_at,
        ];
    }
}
