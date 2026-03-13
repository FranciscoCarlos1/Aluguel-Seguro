<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertySearchRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Property;

class PropertyController extends Controller
{
    public function index(PropertySearchRequest $request)
    {
        $data = $request->validated();
        $perPage = min((int) ($data['per_page'] ?? 12), 50);

        $properties = Property::query()
            ->with('landlord')
            ->where('is_active', true)
            ->where('state', 'SC')
            ->when(!empty($data['city']), function ($query) use ($data) {
                $query->where('city', 'like', '%' . $data['city'] . '%');
            })
            ->when(!empty($data['price_range']), function ($query) use ($data) {
                match ($data['price_range']) {
                    'ate_1000' => $query->where('rent_price', '<=', 1000),
                    '1001_2000' => $query->whereBetween('rent_price', [1001, 2000]),
                    '2001_3000' => $query->whereBetween('rent_price', [2001, 3000]),
                    'acima_3000' => $query->where('rent_price', '>', 3000),
                    default => null,
                };
            })
            ->when(isset($data['bedrooms']), function ($query) use ($data) {
                $query->where('bedrooms', (int) $data['bedrooms']);
            })
            ->when(array_key_exists('garage', $data), function ($query) use ($data) {
                $query->where('has_garage', (bool) $data['garage']);
            })
            ->when(!empty($data['property_type']), function ($query) use ($data) {
                $query->where('property_type', $data['property_type']);
            })
            ->orderBy('rent_price')
            ->paginate($perPage);

        return PropertyResource::collection($properties);
    }

    public function show(Property $property)
    {
        if (!$property->is_active || $property->state !== 'SC') {
            return response()->json(['message' => 'Imovel nao encontrado.'], 404);
        }

        $property->load('landlord');

        return new PropertyResource($property);
    }
}
