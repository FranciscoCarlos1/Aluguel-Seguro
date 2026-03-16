<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\SupportTicketResource;
use App\Models\Landlord;
use App\Models\SupportTicket;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    public function index(Request $request)
    {
        $landlord = $this->resolveLandlord($request);

        $tickets = SupportTicket::query()
            ->where('landlord_id', $landlord->id)
            ->latest()
            ->get();

        return SupportTicketResource::collection($tickets);
    }

    public function store(Request $request)
    {
        $landlord = $this->resolveLandlord($request);
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'phone' => ['required', 'string', 'max:30'],
            'topic' => ['required', 'string', 'max:160'],
            'preferred_time' => ['nullable', 'string', 'max:120'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'contact_channel' => ['nullable', 'string', 'max:30'],
        ]);

        $ticket = SupportTicket::create([
            ...$data,
            'landlord_id' => $landlord->id,
            'status' => 'Recebido pela equipe',
            'contact_channel' => $data['contact_channel'] ?? 'telefone_e_whatsapp',
            'created_by' => $request->user()?->email,
        ]);

        return response()->json([
            'message' => 'Pedido de suporte registrado com sucesso.',
            'ticket' => new SupportTicketResource($ticket),
        ], 201);
    }

    private function resolveLandlord(Request $request): Landlord
    {
        $landlord = Landlord::where('email', $request->user()?->email)->first();

        abort_if(!$landlord, 404, 'Locador nao encontrado para esta sessao.');

        return $landlord;
    }
}
