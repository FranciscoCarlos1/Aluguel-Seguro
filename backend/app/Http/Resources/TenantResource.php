<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'full_name' => $this->full_name,
            'cpf_masked' => $this->maskDocument($this->cpf),
            'rg_masked' => $this->maskDocument($this->rg),
            'email_masked' => $this->maskEmail($this->email),
            'phone_masked' => $this->maskPhone($this->phone),
            'occupation' => $this->occupation,
            'monthly_income_range' => $this->incomeRange($this->monthly_income),
            'address_line' => $this->address_line,
            'address_number' => $this->address_number,
            'address_complement' => $this->address_complement,
            'address_neighborhood' => $this->address_neighborhood,
            'address_city' => $this->address_city,
            'address_state' => $this->address_state,
            'address_postal_code' => $this->address_postal_code,
            'document_last4' => $this->document_last4,
            'notes' => $this->notes,
            'status' => $this->status,
            'created_at' => $this->created_at,
            'profile' => new TenantProfileResource($this->whenLoaded('profile')),
            'reviews' => TenantReviewResource::collection($this->whenLoaded('reviews')),
        ];
    }

    private function maskDocument(?string $value): ?string
    {
        if (!$value) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $value);
        if (!$digits) {
            return $value;
        }

        $last2 = substr($digits, -2);

        return str_repeat('*', max(strlen($digits) - 2, 4)) . $last2;
    }

    private function maskEmail(?string $email): ?string
    {
        if (!$email || !str_contains($email, '@')) {
            return $email;
        }

        [$local, $domain] = explode('@', $email, 2);
        $visible = substr($local, 0, 1);
        $masked = $visible . str_repeat('*', max(strlen($local) - 1, 3));

        return $masked . '@' . $domain;
    }

    private function maskPhone(?string $phone): ?string
    {
        if (!$phone) {
            return null;
        }

        $digits = preg_replace('/\D+/', '', $phone);
        if (!$digits) {
            return $phone;
        }

        $last4 = substr($digits, -4);

        return '***' . $last4;
    }

    private function incomeRange($income): ?string
    {
        if ($income === null) {
            return null;
        }

        $value = (float) $income;

        if ($value <= 2000) {
            return 'ate_2000';
        }

        if ($value <= 5000) {
            return '2000_5000';
        }

        if ($value <= 10000) {
            return '5000_10000';
        }

        return 'acima_10000';
    }
}
