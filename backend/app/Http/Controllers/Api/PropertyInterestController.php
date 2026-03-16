<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\ConfirmInterestPaymentRequest;
use App\Http\Requests\StorePropertyInterestRequest;
use App\Http\Resources\PropertyInterestResource;
use App\Models\Property;
use App\Models\PropertyInterest;
use App\Models\ProspectProfile;
use Illuminate\Support\Str;

class PropertyInterestController extends Controller
{
    private const ANALYSIS_FEE = 4.99;

    public function store(StorePropertyInterestRequest $request, Property $property)
    {
        if (!$property->is_active || $property->state !== 'SC') {
            return response()->json(['message' => 'Imovel nao disponivel.'], 404);
        }

        $data = $request->validated();
        $normalizedPhone = preg_replace('/\D+/', '', $data['tenant_phone']);
        $profile = ProspectProfile::where('phone', $normalizedPhone)->first();
        $alreadyProfiled = (bool) $profile;
        $behavioralAnswers = ProspectProfile::behavioralAnswersFromPayload($data);
        $hasQuestionnaireInput = !empty($behavioralAnswers);
        $hasCompleteQuestionnaire = ProspectProfile::hasCompleteBehavioralAnswers($behavioralAnswers);
        $profileRefreshed = false;

        if (!$profile) {
            if (!$hasCompleteQuestionnaire) {
                return response()->json([
                    'message' => 'Para o primeiro interesse, responda o questionario comportamental completo.',
                    'errors' => [
                        'behavioral_answers' => ['As 7 perguntas sao obrigatorias para criar o perfil inicial.'],
                    ],
                ], 422);
            }

            $legacyProbabilities = ProspectProfile::legacyProbabilitiesFromBehavioralAnswers($behavioralAnswers);
            $profileData = [
                'full_name' => $data['tenant_name'],
                'phone' => $normalizedPhone,
                'email' => $data['tenant_email'] ?? null,
                'occupation' => $data['occupation'] ?? null,
                'monthly_income' => $data['monthly_income'] ?? null,
                'household_size' => $data['household_size'] ?? null,
                'has_pet' => (bool) ($data['has_pet'] ?? false),
                'rental_reason' => $data['rental_reason'] ?? null,
                'additional_notes' => $data['additional_notes'] ?? null,
                'behavioral_answers' => $behavioralAnswers,
                ...$legacyProbabilities,
            ];

            $profileData['score'] = ProspectProfile::scoreFromBehavioralAnswers($behavioralAnswers);
            $profile = ProspectProfile::create($profileData);
        } else {
            $canRefreshQuestionnaire = $profile->updated_at?->lte(now()->subMonths(3)) ?? true;

            if ($hasQuestionnaireInput && !$hasCompleteQuestionnaire) {
                return response()->json([
                    'message' => 'Para atualizar o perfil, responda o questionario comportamental completo.',
                    'errors' => [
                        'behavioral_answers' => ['Envie as 7 respostas para atualizar o perfil salvo.'],
                    ],
                ], 422);
            }

            if ($hasCompleteQuestionnaire && $canRefreshQuestionnaire) {
                $legacyProbabilities = ProspectProfile::legacyProbabilitiesFromBehavioralAnswers($behavioralAnswers);
                $profile->update([
                    'full_name' => $data['tenant_name'],
                    'email' => $data['tenant_email'] ?? $profile->email,
                    'occupation' => $data['occupation'] ?? $profile->occupation,
                    'monthly_income' => $data['monthly_income'] ?? $profile->monthly_income,
                    'household_size' => $data['household_size'] ?? $profile->household_size,
                    'has_pet' => (bool) ($data['has_pet'] ?? $profile->has_pet),
                    'rental_reason' => $data['rental_reason'] ?? $profile->rental_reason,
                    'additional_notes' => $data['additional_notes'] ?? $profile->additional_notes,
                    'behavioral_answers' => $behavioralAnswers,
                    ...$legacyProbabilities,
                    'score' => ProspectProfile::scoreFromBehavioralAnswers($behavioralAnswers),
                ]);
                $profile->refresh();
                $profileRefreshed = true;
            }
        }

        $reference = 'PIX-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(5));
        $pixCopyPaste = '00020126580014BR.GOV.BCB.PIX0136aluguelseguro@pix.exemplo52040000530398654044.995802BR5920ALUGUEL SEGURO LTDA6009SAO PAULO62070503***6304ABCD';

        $interest = PropertyInterest::create([
            'property_id' => $property->id,
            'prospect_profile_id' => $profile->id,
            'analysis_fee' => self::ANALYSIS_FEE,
            'payment_status' => 'pending',
            'payment_reference' => $reference,
            'pix_copy_paste' => $pixCopyPaste,
            'pix_qr_payload' => $pixCopyPaste,
            'profile_access_token' => Str::random(48),
        ]);

        $property->load('landlord');
        $interest->load(['profile', 'property.landlord']);

        $landlordPhone = preg_replace('/\D+/', '', (string) $property->landlord?->phone);
        $profileUrl = url('/api/v1/prospect-profiles/access/' . $interest->profile_access_token);
        $landlordMessage = rawurlencode(
            'Novo interessado no imovel "' . $property->title . '".' . "\n" .
            'Para liberar perfil e contato, pague a taxa de analise de R$ 4,99.' . "\n" .
            'Referencia: ' . $reference . "\n" .
            'PIX copia e cola: ' . $pixCopyPaste . "\n" .
            'Link do perfil (apos pagamento): ' . $profileUrl
        );

        $reviewDueAt = $profile->updated_at?->copy()->addMonths(3);

        return response()->json([
            'already_profiled' => $alreadyProfiled,
            'profile_refreshed' => $profileRefreshed,
            'profile_review_due_at' => $reviewDueAt,
            'message' => !$alreadyProfiled
                ? 'Perfil criado com sucesso e interesse registrado.'
                : ($profileRefreshed
                    ? 'Perfil atualizado com novas respostas comportamentais e interesse registrado.'
                    : 'Perfil ja existente. Questionario reaproveitado para este novo interesse.'),
            'interest' => new PropertyInterestResource($interest),
            'landlord_whatsapp_url' => $landlordPhone
                ? 'https://wa.me/55' . $landlordPhone . '?text=' . $landlordMessage
                : null,
        ], 201);
    }

    public function confirmPayment(ConfirmInterestPaymentRequest $request)
    {
        $reference = $request->validated('payment_reference');

        $interest = PropertyInterest::query()
            ->with(['profile', 'property.landlord'])
            ->where('payment_reference', $reference)
            ->first();

        if (!$interest) {
            return response()->json(['message' => 'Referencia de pagamento nao encontrada.'], 404);
        }

        if ($interest->payment_status !== 'paid') {
            $interest->update([
                'payment_status' => 'paid',
                'paid_at' => now(),
                'central_notified_at' => now(),
            ]);
            $interest->refresh();
        }

        $profile = $interest->profile;
        $profileUrl = url('/api/v1/prospect-profiles/access/' . $interest->profile_access_token);
        $centralMessage =
            'Central Aluguel Seguro: Pagamento confirmado.' . "\n" .
            'Interessado: ' . $profile?->full_name . "\n" .
            'Contato: ' . $profile?->phone . "\n" .
            'Perfil: ' . $profileUrl;

        return response()->json([
            'message' => 'Pagamento confirmado e mensagem da central gerada.',
            'interest' => new PropertyInterestResource($interest->load(['profile', 'property.landlord'])),
            'central_message' => $centralMessage,
        ]);
    }
}
