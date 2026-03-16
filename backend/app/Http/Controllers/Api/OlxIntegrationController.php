<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Models\Landlord;
use App\Models\Property;
use App\Services\OlxApiClient;
use Illuminate\Http\Request;

class OlxIntegrationController extends Controller
{
    public function authUrl(Request $request, OlxApiClient $client)
    {
        $data = $request->validate([
            'redirect_uri' => ['required', 'url', 'max:2000'],
            'state' => ['nullable', 'string', 'max:120'],
            'scope' => ['nullable', 'string', 'max:120'],
        ]);

        return response()->json([
            'authorization_url' => $client->buildAuthorizationUrl(
                $data['redirect_uri'],
                $data['state'] ?? 'aluguel-seguro',
                $data['scope'] ?? 'autoupload'
            ),
        ]);
    }

    public function exchangeToken(Request $request, OlxApiClient $client)
    {
        $data = $request->validate([
            'code' => ['required', 'string', 'max:500'],
            'redirect_uri' => ['required', 'url', 'max:2000'],
        ]);

        return response()->json(
            $client->exchangeAuthorizationCode($data['code'], $data['redirect_uri'])
        );
    }

    public function importProperties(Request $request, OlxApiClient $client)
    {
        $landlord = $this->resolveLandlord($request);

        $data = $request->validate([
            'access_token' => ['required', 'string', 'max:500'],
            'property_ids' => ['required', 'array', 'min:1'],
            'property_ids.*' => ['integer'],
            'category' => ['required', 'integer'],
            'zipcode' => ['required', 'digits:8'],
            'phone' => ['nullable', 'digits_between:10,11'],
            'phone_hidden' => ['nullable', 'boolean'],
            'type' => ['nullable', 'in:s,u'],
            'params' => ['nullable', 'array'],
        ]);

        $properties = Property::query()
            ->where('landlord_id', $landlord->id)
            ->whereIn('id', $data['property_ids'])
            ->get();

        abort_if($properties->isEmpty(), 404, 'Nenhum imovel encontrado para exportacao.');

        $payload = [];
        foreach ($properties as $property) {
            $images = array_values(array_filter(array_unique([
                ...($property->image_urls ?? []),
                $property->hero_image_url,
            ])));

            abort_if(empty($images), 422, 'Todo anuncio exportado para a OLX precisa de ao menos uma imagem.');

            $payload[] = [
                'id' => 'AS-' . $property->id,
                'operation' => 'insert',
                'category' => (int) $data['category'],
                'Subject' => $property->title,
                'Body' => $property->description,
                'Phone' => $data['phone'] ?? preg_replace('/\D+/', '', (string) $landlord->phone),
                'type' => $data['type'] ?? 'u',
                'price' => (int) round((float) $property->rent_price),
                'zipcode' => $data['zipcode'],
                'phone_hidden' => (bool) ($data['phone_hidden'] ?? false),
                'images' => array_slice($images, 0, 20),
                'params' => $data['params'] ?? [],
            ];
        }

        $response = $client->importAds($data['access_token'], $payload);

        return response()->json([
            'message' => 'Requisicao de exportacao enviada para a OLX.',
            'olx' => $response,
            'properties' => PropertyResource::collection($properties),
        ]);
    }

    public function publishedAds(Request $request, OlxApiClient $client)
    {
        $data = $request->validate([
            'access_token' => ['required', 'string', 'max:500'],
            'page_token' => ['nullable', 'string', 'max:500'],
            'ads_status' => ['nullable', 'string', 'max:80'],
            'fetch_size' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        return response()->json(
            $client->listPublishedAds($data['access_token'], [
                'page_token' => $data['page_token'] ?? null,
                'ads_status' => $data['ads_status'] ?? null,
                'fetch_size' => $data['fetch_size'] ?? null,
            ])
        );
    }

    private function resolveLandlord(Request $request): Landlord
    {
        $landlord = Landlord::where('email', $request->user()?->email)->first();

        abort_if(!$landlord, 404, 'Locador nao encontrado para esta sessao.');

        return $landlord;
    }
}