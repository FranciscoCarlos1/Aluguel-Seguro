<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\PropertyResource;
use App\Models\Landlord;
use App\Services\PropertyFeedImporter;
use Illuminate\Http\Request;

class PropertyFeedImportController extends Controller
{
    public function __invoke(Request $request, PropertyFeedImporter $importer)
    {
        $landlord = Landlord::where('email', $request->user()?->email)->first();

        abort_if(!$landlord, 404, 'Locador nao encontrado para esta sessao.');

        $data = $request->validate([
            'feed_url' => ['required', 'url', 'max:2000'],
            'source_name' => ['required', 'string', 'max:80'],
            'format' => ['nullable', 'in:auto,json,xml'],
            'max_items' => ['nullable', 'integer', 'min:1', 'max:200'],
        ]);

        $properties = $importer->importFromUrl(
            $landlord,
            $data['feed_url'],
            $data['source_name'],
            $data['format'] ?? 'auto',
            (int) ($data['max_items'] ?? 50)
        );

        return response()->json([
            'message' => count($properties) . ' imovel(is) importado(s) da fonte autorizada.',
            'properties' => PropertyResource::collection(collect($properties)),
        ], 201);
    }
}
