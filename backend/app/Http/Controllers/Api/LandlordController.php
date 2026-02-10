<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLandlordRequest;
use App\Http\Requests\UpdateLandlordRequest;
use App\Models\Landlord;
use App\Http\Resources\LandlordResource;
use Illuminate\Http\Request;

class LandlordController extends Controller
{
    public function store(StoreLandlordRequest $request)
    {
        $data = $request->validated();
        $data['created_by'] ??= $request->user()?->email;
        $data['updated_by'] ??= $request->user()?->email;

        $landlord = Landlord::create($data);

        return (new LandlordResource($landlord))
            ->response()
            ->setStatusCode(201);
    }

    public function show(Landlord $landlord)
    {
        return new LandlordResource($landlord);
    }

    public function showMe(Request $request)
    {
        $email = $request->user()?->email;
        if (!$email) {
            return response()->json(['message' => 'Sessao invalida.'], 401);
        }

        $landlord = Landlord::where('email', $email)->first();
        if (!$landlord) {
            return response()->json(['message' => 'Locador nao encontrado.'], 404);
        }

        return new LandlordResource($landlord);
    }

    public function update(UpdateLandlordRequest $request, Landlord $landlord)
    {
        $data = $request->validated();
        $data['updated_by'] ??= $request->user()?->email;

        $landlord->update($data);

        return new LandlordResource($landlord->fresh());
    }
}
