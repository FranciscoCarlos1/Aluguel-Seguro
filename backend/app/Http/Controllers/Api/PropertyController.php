<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertySearchRequest;
use App\Http\Resources\PropertyResource;
use App\Models\Landlord;
use App\Models\Property;
use App\Services\DemoCatalogService;
use Illuminate\Http\UploadedFile;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;
use Throwable;

class PropertyController extends Controller
{
    public function index(PropertySearchRequest $request)
    {
        $this->ensureDemoCatalogAvailable();

        $data = $request->validated();
        $perPage = min((int) ($data['per_page'] ?? 12), 50);
        $prospectPhone = preg_replace('/\D+/', '', (string) ($data['prospect_phone'] ?? ''));

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
            ->when($prospectPhone !== '', function ($query) use ($prospectPhone) {
                $query->whereDoesntHave('interests', function ($interestQuery) use ($prospectPhone): void {
                    $interestQuery
                        ->where('hidden_for_prospect', true)
                        ->whereHas('profile', function ($profileQuery) use ($prospectPhone): void {
                            $profileQuery->where('phone', $prospectPhone);
                        });
                });
            })
            ->orderBy('rent_price')
            ->paginate($perPage);

        return PropertyResource::collection($properties);
    }

    public function show(Request $request, Property $property)
    {
        if (!$property->is_active || $property->state !== 'SC') {
            return response()->json(['message' => 'Imovel nao encontrado.'], 404);
        }

        $prospectPhone = preg_replace('/\D+/', '', (string) $request->query('prospect_phone'));
        if ($prospectPhone !== '') {
            $isHidden = $property->interests()
                ->where('hidden_for_prospect', true)
                ->whereHas('profile', function ($query) use ($prospectPhone): void {
                    $query->where('phone', $prospectPhone);
                })
                ->exists();

            if ($isHidden) {
                return response()->json(['message' => 'Imovel nao encontrado.'], 404);
            }
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
            'hero_image_url' => ['nullable', 'url', 'max:2048'],
            'image_urls' => ['nullable', 'array'],
            'image_urls.*' => ['nullable', 'url', 'max:2048'],
            'images' => ['nullable', 'array', 'max:12'],
            'images.*' => ['nullable', 'image', 'max:5120'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $uploadedImageUrls = $this->storeUploadedImages($request, $landlord);
        $imageUrls = collect($data['image_urls'] ?? [])
            ->filter()
            ->merge($uploadedImageUrls)
            ->unique()
            ->values()
            ->all();
        $heroImageUrl = $data['hero_image_url'] ?? ($imageUrls[0] ?? null);

        $property = Property::create(Property::persistableAttributes([
            ...$data,
            'landlord_id' => $landlord->id,
            'state' => strtoupper($data['state'] ?? 'SC'),
            'hero_image_url' => $heroImageUrl,
            'image_urls' => $imageUrls,
            'is_active' => $data['is_active'] ?? true,
        ]));

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

    private function storeUploadedImages(Request $request, Landlord $landlord): array
    {
        $files = $request->file('images', []);

        return collect($files)
            ->filter(fn ($file) => $file instanceof UploadedFile)
            ->map(function (UploadedFile $file) use ($landlord) {
                $directory = sprintf(
                    'properties/%s/%s',
                    $landlord->id,
                    now()->format('Y/m')
                );

                $filename = Str::uuid()->toString() . '.' . $file->getClientOriginalExtension();
                $path = $file->storePubliclyAs($directory, $filename, 'public');

                return Storage::disk('public')->url($path);
            })
            ->values()
            ->all();
    }

    private function ensureDemoCatalogAvailable(): void
    {
        if (!app()->environment('production')) {
            return;
        }

        try {
            if (!Schema::hasTable('properties') || Property::query()->exists()) {
                return;
            }

            app(DemoCatalogService::class)->ensureCatalogAvailable();
        } catch (Throwable $exception) {
            report($exception);
        }
    }
}
