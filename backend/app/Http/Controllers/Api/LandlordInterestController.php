<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\LandlordInterestResource;
use App\Models\Contract;
use App\Models\Landlord;
use App\Models\PaymentSlip;
use App\Models\PropertyInterest;
use App\Models\Tenant;
use App\Models\VisitSchedule;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class LandlordInterestController extends Controller
{
    public function index(Request $request)
    {
        $landlord = $this->resolveLandlord($request);

        $interests = PropertyInterest::query()
            ->with(['property.landlord', 'profile', 'visit', 'contract.paymentSlips'])
            ->whereHas('property', function ($query) use ($landlord): void {
                $query->where('landlord_id', $landlord->id);
            })
            ->latest()
            ->get();

        return LandlordInterestResource::collection($interests);
    }

    public function markPaid(Request $request, PropertyInterest $interest)
    {
        $this->ensureInterestOwnership($request, $interest);

        if ($interest->payment_status !== 'paid') {
            $interest->update([
                'payment_status' => 'paid',
                'paid_at' => now(),
                'central_notified_at' => now(),
            ]);
        }

        return response()->json([
            'message' => 'Taxa de analise confirmada.',
            'interest' => new LandlordInterestResource($interest->fresh(['property.landlord', 'profile', 'visit', 'contract.paymentSlips'])),
        ]);
    }

    public function requestContact(Request $request, PropertyInterest $interest)
    {
        $landlord = $this->ensureInterestOwnership($request, $interest);

        $visit = VisitSchedule::firstOrCreate(
            ['property_interest_id' => $interest->id],
            [
                'property_id' => $interest->property_id,
                'landlord_id' => $landlord->id,
                'scheduled_for' => now()->addDays(2),
                'status' => 'requested',
                'mode' => 'presencial',
                'operator_name' => 'Equipe Aluguel Seguro',
                'notes' => 'Contato inicial solicitado pelo locador.',
                'created_by' => $request->user()?->email,
            ]
        );

        $interest->update([
            'landlord_decision' => 'contact_requested',
            'contact_requested_at' => now(),
            'landlord_notes' => $request->string('notes')->value() ?: 'Locador solicitou contato mediado pela equipe.',
        ]);

        return response()->json([
            'message' => 'Contato solicitado e visita colocada na fila da equipe.',
            'interest' => new LandlordInterestResource($interest->fresh(['property.landlord', 'profile', 'visit', 'contract.paymentSlips'])),
            'visit' => $visit,
        ]);
    }

    public function reject(Request $request, PropertyInterest $interest)
    {
        $this->ensureInterestOwnership($request, $interest);

        $reason = $request->validate([
            'reason' => ['nullable', 'string', 'max:1000'],
        ])['reason'] ?? 'Perfil nao apropriado para este imovel.';

        $interest->update([
            'landlord_decision' => 'rejected',
            'rejected_at' => now(),
            'hidden_for_prospect' => true,
            'landlord_notes' => $reason,
        ]);

        return response()->json([
            'message' => 'Perfil marcado como nao apropriado. O imovel pode ser ocultado para este interessado.',
            'tenant_whatsapp_message' => 'Este imovel nao esta mais disponivel no momento. Nossa equipe segue a disposicao para novas oportunidades.',
            'interest' => new LandlordInterestResource($interest->fresh(['property.landlord', 'profile', 'visit', 'contract.paymentSlips'])),
        ]);
    }

    public function generateContract(Request $request, PropertyInterest $interest)
    {
        $landlord = $this->ensureInterestOwnership($request, $interest);
        $data = $request->validate([
            'start_date' => ['required', 'date'],
            'end_date' => ['nullable', 'date', 'after:start_date'],
            'rent_amount' => ['required', 'numeric', 'min:0'],
            'deposit_amount' => ['nullable', 'numeric', 'min:0'],
            'fire_insurance' => ['nullable', 'numeric', 'min:0'],
            'garbage_fee' => ['nullable', 'numeric', 'min:0'],
            'boleto_installments' => ['nullable', 'integer', 'min:1', 'max:3'],
            'cancellation_fee' => ['nullable', 'numeric', 'min:0'],
            'require_paystub' => ['nullable', 'boolean'],
            'require_prolabore' => ['nullable', 'boolean'],
            'enable_serasa' => ['nullable', 'boolean'],
        ]);

        $interest->loadMissing(['property', 'profile', 'contract.paymentSlips']);

        if ($interest->contract) {
            return response()->json([
                'message' => 'Este interesse ja possui um contrato vinculado.',
                'interest' => new LandlordInterestResource($interest),
            ], 409);
        }

        $result = DB::transaction(function () use ($request, $landlord, $interest, $data) {
            $profile = $interest->profile;
            $tenant = Tenant::query()
                ->where(function ($query) use ($profile): void {
                    if ($profile?->email) {
                        $query->orWhere('email', $profile->email);
                    }
                    if ($profile?->phone) {
                        $query->orWhere('phone', $profile->phone);
                    }
                })
                ->first();

            if (!$tenant) {
                $tenant = Tenant::create([
                    'full_name' => $profile?->full_name ?? 'Inquilino em analise',
                    'email' => $profile?->email,
                    'phone' => $profile?->phone,
                    'occupation' => $profile?->occupation ?? 'Profissao nao informada',
                    'monthly_income' => $profile?->monthly_income ?? 0,
                    'score' => $profile?->score,
                    'cpf' => null,
                    'rg' => null,
                    'document_last4' => substr(preg_replace('/\D+/', '', (string) $profile?->phone), -4) ?: null,
                    'notes' => 'Cadastro gerado a partir do interesse no imovel. Documentos complementares podem ser anexados na etapa de contrato.',
                    'status' => 'active',
                    'created_by' => $request->user()?->email,
                    'updated_by' => $request->user()?->email,
                ]);
            }

            $contract = Contract::create([
                'property_id' => $interest->property_id,
                'landlord_id' => $landlord->id,
                'tenant_id' => $tenant->id,
                'property_interest_id' => $interest->id,
                'start_date' => $data['start_date'],
                'end_date' => $data['end_date'] ?? null,
                'rent_amount' => $data['rent_amount'],
                'deposit_amount' => $data['deposit_amount'] ?? null,
                'fire_insurance' => $data['fire_insurance'] ?? null,
                'garbage_fee' => $data['garbage_fee'] ?? null,
                'status' => 'draft',
                'contract_text' => $this->buildContractText($interest, $tenant, $landlord, $data),
            ]);

            $slips = $this->createInitialPaymentSlips($contract, $data);

            $interest->update([
                'landlord_decision' => 'contract_ready',
                'contract_ready_at' => now(),
                'landlord_notes' => 'Contrato e boletos iniciais preparados no portal do locador.',
            ]);

            return [$contract->load(['property', 'landlord', 'tenant', 'paymentSlips']), $tenant, $slips];
        });

        [$contract, $tenant, $slips] = $result;

        return response()->json([
            'message' => 'Contrato digital e boletos iniciais gerados com sucesso.',
            'contract' => $contract,
            'tenant' => $tenant,
            'payment_slips' => $slips,
            'interest' => new LandlordInterestResource($interest->fresh(['property.landlord', 'profile', 'visit', 'contract.paymentSlips'])),
        ], 201);
    }

    private function createInitialPaymentSlips(Contract $contract, array $data): array
    {
        $total = (float) ($data['fire_insurance'] ?? 0) + (float) ($data['garbage_fee'] ?? 0);
        $installments = max(1, (int) ($data['boleto_installments'] ?? 1));

        if ($total <= 0) {
            return [];
        }

        $items = [];
        $installmentAmount = round($total / $installments, 2);

        for ($index = 1; $index <= $installments; $index++) {
            $amount = $index === $installments
                ? round($total - ($installmentAmount * ($installments - 1)), 2)
                : $installmentAmount;

            $items[] = PaymentSlip::create([
                'contract_id' => $contract->id,
                'due_date' => now()->addDays(7 * $index)->toDateString(),
                'amount' => $amount,
                'status' => 'pending',
                'bank_code' => '001',
                'bank_slip_number' => 'SLIP-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(5)),
                'pdf_url' => null,
                'payment_link' => null,
                'description' => 'Taxa de lixo e seguro incendio - parcela ' . $index,
                'installment_number' => $index,
                'installment_total' => $installments,
                'fine' => 0,
                'interest' => 0,
            ]);
        }

        return $items;
    }

    private function buildContractText(PropertyInterest $interest, Tenant $tenant, Landlord $landlord, array $data): string
    {
        $property = $interest->property;
        $profile = $interest->profile;
        $clauses = [
            'Garantias aceitas: ' . (!empty($data['require_paystub']) ? 'contracheque ' : '') . (!empty($data['require_prolabore']) ? 'pro-labore' : 'analise de perfil e caucao reduzida'),
            'Caucao limitada ao valor de um aluguel.',
            'Clausula de cancelamento com multa de ' . number_format((float) ($data['cancellation_fee'] ?? 0), 2, ',', '.') . ' reais.',
            !empty($data['enable_serasa'])
                ? 'Em caso de inadimplencia, podera haver previsao contratual de SPC/Serasa.'
                : 'Sem previsao automatica de SPC/Serasa neste rascunho.',
            'Taxa de lixo e seguro incendio pagos na assinatura, com parcelamento inicial de ate ' . (int) ($data['boleto_installments'] ?? 1) . ' parcela(s).',
            'Contato e agendamento apoiados pela equipe Aluguel Seguro.',
        ];

        return implode("\n", [
            'CONTRATO DE LOCACAO ASSISTIDA - ALUGUEL SEGURO',
            'Locador: ' . $landlord->name . ' (' . $landlord->email . ')',
            'Inquilino: ' . $tenant->full_name . ' - perfil comportamental ' . ($profile?->score ?? 'n/d') . '/100',
            'Imovel: ' . $property?->title . ' - ' . $property?->city . '/' . $property?->state,
            'Valor mensal: R$ ' . number_format((float) $data['rent_amount'], 2, ',', '.'),
            'Inicio: ' . $data['start_date'],
            'Encerramento previsto: ' . ($data['end_date'] ?? 'prazo em aberto'),
            '--- CLAUSULAS PRINCIPAIS ---',
            ...$clauses,
            '--- OBSERVACAO ---',
            'Este documento foi gerado no portal do locador e sera assinado digitalmente sem cartorio.',
        ]);
    }

    private function resolveLandlord(Request $request): Landlord
    {
        $landlord = Landlord::where('email', $request->user()?->email)->first();

        abort_if(!$landlord, 404, 'Locador nao encontrado para esta sessao.');

        return $landlord;
    }

    private function ensureInterestOwnership(Request $request, PropertyInterest $interest): Landlord
    {
        $landlord = $this->resolveLandlord($request);
        $interest->loadMissing('property');

        abort_if((int) $interest->property?->landlord_id !== (int) $landlord->id, 403, 'Este interesse nao pertence ao locador autenticado.');

        return $landlord;
    }
}
