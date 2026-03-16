<?php

namespace App\Services;

use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Http;

class OlxApiClient
{
    public function buildAuthorizationUrl(string $redirectUri, string $state = 'aluguel-seguro', string $scope = 'autoupload'): string
    {
        $query = http_build_query([
            'client_id' => config('services.olx.client_id'),
            'redirect_uri' => $redirectUri,
            'response_type' => 'code',
            'scope' => $scope,
            'state' => $state,
        ]);

        return rtrim(config('services.olx.auth_base_url'), '/') . '/oauth?' . $query;
    }

    public function exchangeAuthorizationCode(string $code, string $redirectUri): array
    {
        $response = Http::asForm()
            ->timeout(20)
            ->post(rtrim(config('services.olx.auth_base_url'), '/') . '/oauth/token', [
                'code' => $code,
                'client_id' => config('services.olx.client_id'),
                'client_secret' => config('services.olx.client_secret'),
                'redirect_uri' => $redirectUri,
                'grant_type' => 'authorization_code',
            ]);

        $response->throw();

        return $response->json();
    }

    public function importAds(string $accessToken, array $adList): array
    {
        $response = Http::timeout(30)
            ->contentType('application/json')
            ->put(rtrim(config('services.olx.apps_base_url'), '/') . '/autoupload/import', [
                'access_token' => $accessToken,
                'ad_list' => array_values($adList),
            ]);

        $response->throw();

        return $response->json();
    }

    public function listPublishedAds(string $accessToken, array $filters = []): array
    {
        $query = array_filter([
            'page_token' => Arr::get($filters, 'page_token'),
            'ads_status' => Arr::get($filters, 'ads_status'),
            'fetch_size' => Arr::get($filters, 'fetch_size'),
        ], static fn ($value) => $value !== null && $value !== '');

        $response = Http::timeout(20)
            ->withToken($accessToken)
            ->get(rtrim(config('services.olx.apps_base_url'), '/') . '/autoupload/v1/published', $query);

        $response->throw();

        return $response->json();
    }
}