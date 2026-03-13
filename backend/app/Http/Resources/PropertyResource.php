<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PropertyResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'title' => $this->title,
            'city' => $this->city,
            'state' => $this->state,
            'rent_price' => $this->rent_price,
            'price_range' => $this->priceRange(),
            'bedrooms' => $this->bedrooms,
            'has_garage' => $this->has_garage,
            'property_type' => $this->property_type,
            'description' => $this->description,
            'address_line' => $this->address_line,
            'address_number' => $this->address_number,
            'address_neighborhood' => $this->address_neighborhood,
            'landlord' => [
                'id' => $this->landlord?->id,
                'name' => $this->landlord?->name,
                'phone' => $this->landlord?->phone,
            ],
            'created_at' => $this->created_at,
        ];
    }
}
