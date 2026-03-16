<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertySearchRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Landlord;
use App\Models\Property;
use Illuminate\Http\Request;

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

    public function landlordIndex(Request $request)
    {
        $landlord = $this->resolveLandlord($request);

        $properties = Property::query()
            ->with('landlord')
            ->where('landlord_id', $landlord->id)
            ->latest()
            ->get();

        return PropertyResource::collection($properties);
    }

    public function store(Request $request)
    {
        $landlord = $this->resolveLandlord($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:160'],
            'city' => ['required', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'max:2'],
            'rent_price' => ['required', 'numeric', 'min:0'],
            'bedrooms' => ['required', 'integer', 'min:0', 'max:10'],
            'has_garage' => ['required', 'boolean'],
            'property_type' => ['required', 'in:kitnet,casa,apartamento,casa_condominio'],
            'description' => ['required', 'string', 'max:4000'],
            'address_neighborhood' => ['nullable', 'string', 'max:120'],
            'address_line' => ['nullable', 'string', 'max:160'],
            'address_number' => ['nullable', 'string', 'max:20'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $property = Property::create([
            ...$data,
            'landlord_id' => $landlord->id,
            'state' => strtoupper($data['state'] ?? 'SC'),
            'is_active' => $data['is_active'] ?? true,
        ]);

        $property->load('landlord');

        return (new PropertyResource($property))
            ->response()
            ->setStatusCode(201);
    }

    private function resolveLandlord(Request $request): Landlord
    {
        $landlord = Landlord::where('email', $request->user()?->email)->first();

        abort_if(!$landlord, 404, 'Locador nao encontrado para esta sessao.');

        return $landlord;
    }
}
