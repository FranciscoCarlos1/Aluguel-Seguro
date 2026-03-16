<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\VisitScheduleResource;
use App\Models\Landlord;
use App\Models\VisitSchedule;
use Illuminate\Http\Request;

class VisitScheduleController extends Controller
{
    public function index(Request $request)
    {
        $landlord = $this->resolveLandlord($request);

        $visits = VisitSchedule::query()
            ->with(['interest.profile', 'property'])
            ->where('landlord_id', $landlord->id)
            ->orderByRaw("case when status = 'requested' then 0 when status = 'confirmed' then 1 else 2 end")
            ->orderBy('scheduled_for')
            ->get();

        return VisitScheduleResource::collection($visits);
    }

    public function confirm(Request $request, VisitSchedule $visit)
    {
        $this->ensureOwnership($request, $visit);

        $visit->update([
            'status' => 'confirmed',
            'scheduled_for' => $request->input('scheduled_for', $visit->scheduled_for ?? now()->addDays(2)),
            'notes' => $request->string('notes')->value() ?: $visit->notes,
        ]);

        return response()->json([
            'message' => 'Visita confirmada com sucesso.',
            'visit' => new VisitScheduleResource($visit->fresh(['interest.profile', 'property'])),
        ]);
    }

    public function cancel(Request $request, VisitSchedule $visit)
    {
        $this->ensureOwnership($request, $visit);

        $visit->update([
            'status' => 'canceled',
            'notes' => $request->string('notes')->value() ?: 'Visita cancelada pelo locador.',
        ]);

        return response()->json([
            'message' => 'Visita cancelada.',
            'visit' => new VisitScheduleResource($visit->fresh(['interest.profile', 'property'])),
        ]);
    }

    private function resolveLandlord(Request $request): Landlord
    {
        $landlord = Landlord::where('email', $request->user()?->email)->first();

        abort_if(!$landlord, 404, 'Locador nao encontrado para esta sessao.');

        return $landlord;
    }

    private function ensureOwnership(Request $request, VisitSchedule $visit): void
    {
        $landlord = $this->resolveLandlord($request);
        abort_if((int) $visit->landlord_id !== (int) $landlord->id, 403, 'Esta visita nao pertence ao locador autenticado.');
    }
}
