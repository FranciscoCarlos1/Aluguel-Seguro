<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class GooglePropertySearchService
{
    public function search(array $filters): array
    {
        $apiKey = config('services.google_search.api_key');
        $engineId = config('services.google_search.engine_id');

        if (!$apiKey || !$engineId) {
            throw new \RuntimeException('A busca Google do sistema ainda nao foi configurada. Defina GOOGLE_SEARCH_API_KEY e GOOGLE_SEARCH_ENGINE_ID.');
        }

        $response = Http::timeout(20)->get(config('services.google_search.base_url'), [
            'key' => $apiKey,
            'cx' => $engineId,
            'q' => $this->buildQuery($filters),
            'num' => min((int) ($filters['limit'] ?? 10), 10),
            'safe' => 'off',
            'hl' => 'pt-BR',
            'gl' => 'br',
        ]);

        $response->throw();

        $payload = $response->json();
        $items = $payload['items'] ?? [];

        return array_map(function (array $item): array {
            return [
                'title' => $item['title'] ?? 'Anuncio externo',
                'link' => $item['link'] ?? null,
                'snippet' => $item['snippet'] ?? '',
                'display_link' => $item['displayLink'] ?? '',
                'source_name' => 'google',
            ];
        }, $items);
    }

    private function buildQuery(array $filters): string
    {
        $parts = ['aluguel imovel'];

        if (!empty($filters['property_type'])) {
            $parts[] = match ($filters['property_type']) {
                'kitnet' => 'kitnet',
                'casa' => 'casa',
                'apartamento' => 'apartamento',
                'casa_condominio' => 'casa em condominio',
                default => 'imovel',
            };
        }

        if (!empty($filters['bedrooms'])) {
            $parts[] = $filters['bedrooms'] . ' quartos';
        }

        if (($filters['garage'] ?? '') === '1') {
            $parts[] = 'com garagem';
        }

        if (($filters['garage'] ?? '') === '0') {
            $parts[] = 'sem garagem';
        }

        if (!empty($filters['price_range'])) {
            $parts[] = match ($filters['price_range']) {
                'ate_1000' => 'ate 1000 reais',
                '1001_2000' => 'de 1001 a 2000 reais',
                '2001_3000' => 'de 2001 a 3000 reais',
                'acima_3000' => 'acima de 3000 reais',
                default => '',
            };
        }

        if (!empty($filters['city'])) {
            $parts[] = $filters['city'];
        }

        if (!empty($filters['state'])) {
            $parts[] = $filters['state'];
        }

        $parts[] = config('services.google_search.site_query', 'site:olx.com.br OR site:vivareal.com.br OR site:zapimoveis.com.br');

        return trim(implode(' ', array_filter($parts)));
    }
}
