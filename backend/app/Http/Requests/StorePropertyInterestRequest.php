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
            'payment_probability' => ['nullable', 'in:muito_provavel,provavel,pouco_provavel,improvavel'],
            'care_probability' => ['nullable', 'in:muito_provavel,provavel,pouco_provavel,improvavel'],
            'income_stability_probability' => ['nullable', 'in:muito_provavel,provavel,pouco_provavel,improvavel'],
            'neighbor_relation_probability' => ['nullable', 'in:muito_provavel,provavel,pouco_provavel,improvavel'],
        ];
    }
}
