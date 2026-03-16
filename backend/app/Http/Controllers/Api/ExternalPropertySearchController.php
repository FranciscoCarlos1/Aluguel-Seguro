<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\GooglePropertySearchService;
use RuntimeException;
use Illuminate\Http\Request;
use Throwable;

class ExternalPropertySearchController extends Controller
{
    public function google(Request $request, GooglePropertySearchService $service)
    {
        $filters = $request->validate([
            'state' => ['nullable', 'string', 'max:4'],
            'city' => ['nullable', 'string', 'max:120'],
            'price_range' => ['nullable', 'string', 'max:40'],
            'bedrooms' => ['nullable', 'string', 'max:10'],
            'garage' => ['nullable', 'string', 'max:5'],
            'property_type' => ['nullable', 'string', 'max:40'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:10'],
        ]);

        try {
            return response()->json([
                'source' => 'google',
                'data' => $service->search($filters),
            ]);
        } catch (RuntimeException $exception) {
            return response()->json([
                'message' => $exception->getMessage(),
                'source' => 'google',
                'data' => [],
            ], 503);
        } catch (Throwable $exception) {
            report($exception);

            return response()->json([
                'message' => 'Nao foi possivel consultar a busca externa agora.',
                'source' => 'google',
                'data' => [],
            ], 502);
        }
    }
}
