<?php

namespace App\Services;

use App\Models\Landlord;
use App\Models\Property;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

class PropertyFeedImporter
{
    public function importFromUrl(Landlord $landlord, string $feedUrl, string $sourceName, string $format = 'auto', int $maxItems = 50): array
    {
        $response = Http::timeout(20)->accept('application/json, application/xml, text/xml, */*')->get($feedUrl);
        $response->throw();

        $payload = $response->body();
        $items = $this->extractItems($payload, $format);
        $items = array_slice($items, 0, max(1, min($maxItems, 200)));

        $imported = [];
        foreach ($items as $item) {
            $normalized = $this->normalizeItem($item, $sourceName);
            if (!$normalized) {
                continue;
            }

            $property = Property::updateOrCreate(
                [
                    'landlord_id' => $landlord->id,
                    'source_name' => $sourceName,
                    'source_reference' => $normalized['source_reference'],
                ],
                $normalized
            );

            $imported[] = $property->fresh('landlord');
        }

        return $imported;
    }

    private function extractItems(string $payload, string $format): array
    {
        $resolvedFormat = $format === 'auto' ? $this->detectFormat($payload) : $format;

        return match ($resolvedFormat) {
            'json' => $this->extractJsonItems($payload),
            'xml' => $this->extractXmlItems($payload),
            default => throw new \InvalidArgumentException('Formato de feed nao suportado.'),
        };
    }

    private function detectFormat(string $payload): string
    {
        $trimmed = ltrim($payload);

        if (Str::startsWith($trimmed, ['{', '['])) {
            return 'json';
        }

        if (Str::startsWith($trimmed, ['<', '<?xml'])) {
            return 'xml';
        }

        throw new \InvalidArgumentException('Nao foi possivel detectar automaticamente o formato do feed.');
    }

    private function extractJsonItems(string $payload): array
    {
        $decoded = json_decode($payload, true, flags: JSON_THROW_ON_ERROR);

        if (is_array($decoded) && array_is_list($decoded)) {
            return $decoded;
        }

        foreach (['data', 'items', 'listings', 'properties', 'results'] as $key) {
            $items = data_get($decoded, $key);
            if (is_array($items)) {
                return array_is_list($items) ? $items : [$items];
            }
        }

        return is_array($decoded) ? [$decoded] : [];
    }

    private function extractXmlItems(string $payload): array
    {
        $xml = simplexml_load_string($payload, 'SimpleXMLElement', LIBXML_NOCDATA);
        if (!$xml) {
            throw new \InvalidArgumentException('Nao foi possivel interpretar o XML informado.');
        }

        $json = json_decode(json_encode($xml), true);
        foreach (['property', 'properties.property', 'item', 'items.item', 'listing', 'listings.listing'] as $path) {
            $items = data_get($json, $path);
            if (is_array($items)) {
                return array_is_list($items) ? $items : [$items];
            }
        }

        return is_array($json) ? [$json] : [];
    }

    private function normalizeItem(array $item, string $sourceName): ?array
    {
        $title = $this->firstValue($item, ['title', 'name', 'headline']);
        $city = $this->firstValue($item, ['city', 'cidade', 'location.city', 'address.city']);
        $price = $this->firstValue($item, ['rent_price', 'price', 'value', 'pricing.rent']);

        if (!$title || !$city || $price === null) {
            return null;
        }

        $rawType = (string) ($this->firstValue($item, ['property_type', 'type', 'category', 'propertyType']) ?? 'apartamento');
        $images = $this->normalizeImages($item);

        return [
            'source_name' => Str::limit($sourceName, 80, ''),
            'source_reference' => (string) ($this->firstValue($item, ['external_id', 'id', 'reference', 'code', 'uuid']) ?? md5($title . $city . $price)),
            'title' => Str::limit((string) $title, 160, ''),
            'city' => Str::limit((string) $city, 120, ''),
            'state' => strtoupper((string) ($this->firstValue($item, ['state', 'uf', 'location.state', 'address.state']) ?? 'SC')),
            'rent_price' => $this->normalizePrice($price),
            'bedrooms' => max(0, (int) ($this->firstValue($item, ['bedrooms', 'quartos', 'details.bedrooms']) ?? 1)),
            'has_garage' => $this->normalizeBool($this->firstValue($item, ['has_garage', 'garage', 'vaga_garagem', 'details.garage'])),
            'property_type' => $this->normalizePropertyType($rawType),
            'description' => (string) ($this->firstValue($item, ['description', 'descricao', 'body']) ?? ''),
            'address_line' => Str::limit((string) ($this->firstValue($item, ['address_line', 'address', 'logradouro']) ?? ''), 180, ''),
            'address_number' => Str::limit((string) ($this->firstValue($item, ['address_number', 'numero']) ?? ''), 20, ''),
            'address_neighborhood' => Str::limit((string) ($this->firstValue($item, ['address_neighborhood', 'neighborhood', 'bairro', 'address.neighborhood']) ?? ''), 120, ''),
            'source_url' => $this->firstValue($item, ['source_url', 'url', 'link', 'permalink']),
            'hero_image_url' => $images[0] ?? null,
            'image_urls' => $images ?: null,
            'is_active' => true,
        ];
    }

    private function normalizeImages(array $item): array
    {
        $images = $this->firstValue($item, ['images', 'photos', 'media.images']);

        if (is_string($images) && filter_var($images, FILTER_VALIDATE_URL)) {
            return [$images];
        }

        if (!is_array($images)) {
            $single = $this->firstValue($item, ['image', 'image_url', 'photo', 'thumbnail']);
            return is_string($single) && filter_var($single, FILTER_VALIDATE_URL) ? [$single] : [];
        }

        $urls = [];
        foreach ($images as $image) {
            if (is_string($image) && filter_var($image, FILTER_VALIDATE_URL)) {
                $urls[] = $image;
                continue;
            }

            if (is_array($image)) {
                $candidate = $this->firstValue($image, ['url', 'href', 'src']);
                if (is_string($candidate) && filter_var($candidate, FILTER_VALIDATE_URL)) {
                    $urls[] = $candidate;
                }
            }
        }

        return array_values(array_unique($urls));
    }

    private function normalizePrice(mixed $price): float
    {
        if (is_numeric($price)) {
            return (float) $price;
        }

        $normalized = preg_replace('/[^\d,\.]/', '', (string) $price);
        $normalized = str_replace('.', '', $normalized);
        $normalized = str_replace(',', '.', $normalized);

        return (float) $normalized;
    }

    private function normalizeBool(mixed $value): bool
    {
        if (is_bool($value)) {
            return $value;
        }

        return in_array(Str::lower((string) $value), ['1', 'true', 'sim', 'yes', 'com_garagem'], true);
    }

    private function normalizePropertyType(string $value): string
    {
        $normalized = Str::lower(Str::ascii($value));

        return match (true) {
            Str::contains($normalized, 'kitnet'),
            Str::contains($normalized, 'studio') => 'kitnet',
            Str::contains($normalized, 'condominio') => 'casa_condominio',
            Str::contains($normalized, 'casa') => 'casa',
            default => 'apartamento',
        };
    }

    private function firstValue(array $data, array $keys): mixed
    {
        foreach ($keys as $key) {
            $value = data_get($data, $key);
            if ($value !== null && $value !== '') {
                return $value;
            }
        }

        return null;
    }
}
