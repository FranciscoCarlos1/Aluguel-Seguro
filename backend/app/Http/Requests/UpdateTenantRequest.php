<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenant = $this->route('tenant');

        return [
            'full_name' => ['sometimes', 'required', 'string', 'max:160'],
            'cpf' => ['sometimes', 'required', 'string', 'max:20'],
            'rg' => ['sometimes', 'required', 'string', 'max:20'],
            'email' => [
                'nullable',
                'email',
                'max:120',
                Rule::unique('tenants', 'email')->ignore($tenant?->id),
            ],
            'phone' => ['nullable', 'string', 'max:30'],
            'occupation' => ['sometimes', 'required', 'string', 'max:120'],
            'monthly_income' => ['sometimes', 'required', 'numeric', 'min:0'],
            'address_line' => ['sometimes', 'required', 'string', 'max:180'],
            'address_number' => ['sometimes', 'required', 'string', 'max:20'],
            'address_complement' => ['nullable', 'string', 'max:120'],
            'address_neighborhood' => ['sometimes', 'required', 'string', 'max:120'],
            'address_city' => ['sometimes', 'required', 'string', 'max:120'],
            'address_state' => ['sometimes', 'required', 'string', 'max:40'],
            'address_postal_code' => ['sometimes', 'required', 'string', 'max:12'],
            'document_last4' => ['nullable', 'digits:4'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:active,inactive'],
            'created_by' => ['nullable', 'string', 'max:120'],
            'updated_by' => ['nullable', 'string', 'max:120'],
            'data_redacted_at' => ['nullable', 'date'],
        ];
    }
}
