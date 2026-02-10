<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreLandlordRequest;
use App\Models\Landlord;
use App\Http\Resources\LandlordResource;

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
}
