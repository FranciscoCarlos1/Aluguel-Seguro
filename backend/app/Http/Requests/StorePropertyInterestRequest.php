<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePropertyInterestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'tenant_name' => ['required', 'string', 'max:160'],
            'tenant_phone' => ['required', 'string', 'max:30'],
            'tenant_email' => ['nullable', 'email', 'max:120'],
            'occupation' => ['nullable', 'string', 'max:120'],
            'monthly_income' => ['nullable', 'numeric', 'min:0'],
            'household_size' => ['nullable', 'integer', 'min:1', 'max:12'],
            'has_pet' => ['required', 'boolean'],
            'rental_reason' => ['nullable', 'string', 'max:1000'],
            'additional_notes' => ['nullable', 'string', 'max:1500'],
            'care_reflection' => ['nullable', 'in:concordo_totalmente,concordo,neutro,discordo,discordo_totalmente'],
            'quiet_refuge' => ['nullable', 'in:concordo_totalmente,concordo,neutro,discordo,discordo_totalmente'],
            'financial_commitment' => ['nullable', 'in:concordo_totalmente,concordo,neutro,discordo,discordo_totalmente'],
            'stability_focus' => ['nullable', 'in:concordo_totalmente,concordo,neutro,discordo,discordo_totalmente'],
            'visitors_sharing' => ['nullable', 'in:concordo_totalmente,concordo,neutro,discordo,discordo_totalmente'],
            'rule_respect' => ['nullable', 'in:concordo_totalmente,concordo,neutro,discordo,discordo_totalmente'],
            'preventive_maintenance' => ['nullable', 'in:concordo_totalmente,concordo,neutro,discordo,discordo_totalmente'],
        ];
    }
}
