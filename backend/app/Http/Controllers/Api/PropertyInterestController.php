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
    public function store(StorePropertyInterestRequest $request, Property $property)
    {
        if (!$property->is_active || $property->state !== 'SC') {
            return response()->json(['message' => 'Imovel nao disponivel.'], 404);
        }

        $data = $request->validated();
        $normalizedPhone = preg_replace('/\D+/', '', $data['tenant_phone']);
        $profile = ProspectProfile::where('phone', $normalizedPhone)->first();
        $alreadyProfiled = (bool) $profile;

        if (!$profile) {
            $requiredAnswers = [
                'payment_probability',
                'care_probability',
                'income_stability_probability',
                'neighbor_relation_probability',
            ];

            foreach ($requiredAnswers as $field) {
                if (empty($data[$field])) {
                    return response()->json([
                        'message' => 'Para o primeiro interesse, responda o questionario de probabilidade completo.',
                        'errors' => [$field => ['Campo obrigatorio para criar o perfil inicial.']],
                    ], 422);
                }
            }

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
                'payment_probability' => $data['payment_probability'],
                'care_probability' => $data['care_probability'],
                'income_stability_probability' => $data['income_stability_probability'],
                'neighbor_relation_probability' => $data['neighbor_relation_probability'],
            ];

            $profileData['score'] = ProspectProfile::scoreFromProbabilities($profileData);
            $profile = ProspectProfile::create($profileData);
        }

        $reference = 'PIX-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(5));
        $pixCopyPaste = '00020126580014BR.GOV.BCB.PIX0136aluguelseguro@pix.exemplo52040000530398654045.995802BR5920ALUGUEL SEGURO LTDA6009SAO PAULO62070503***6304ABCD';

        $interest = PropertyInterest::create([
            'property_id' => $property->id,
            'prospect_profile_id' => $profile->id,
            'analysis_fee' => 5.99,
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
            'Para liberar perfil e contato, pague a taxa de analise de R$ 5,99.' . "\n" .
            'Referencia: ' . $reference . "\n" .
            'PIX copia e cola: ' . $pixCopyPaste . "\n" .
            'Link do perfil (apos pagamento): ' . $profileUrl
        );

        return response()->json([
            'already_profiled' => $alreadyProfiled,
            'message' => $alreadyProfiled
                ? 'Perfil ja existente. Questionario reaproveitado para este novo interesse.'
                : 'Perfil criado com sucesso e interesse registrado.',
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
