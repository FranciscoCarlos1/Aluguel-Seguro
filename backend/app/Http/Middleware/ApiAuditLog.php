<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Symfony\Component\HttpFoundation\Response;

class ApiAuditLog
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        Log::info('api.request', [
            'method' => $request->method(),
            'path' => $request->path(),
            'user_id' => $request->user()?->id,
            'ip' => $request->ip(),
            'status' => $response->getStatusCode(),
        ]);

        return $response;
    }
}
