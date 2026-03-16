<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'name' => 'Aluguel Seguro API',
        'status' => 'ok',
        'health' => url('/api/health'),
        'version' => url('/api/v1'),
    ]);
});
