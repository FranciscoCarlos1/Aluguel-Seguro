<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['required', 'string', 'max:160'],
            'cpf' => ['required', 'string', 'max:20'],
            'rg' => ['required', 'string', 'max:20'],
            'email' => ['nullable', 'email', 'max:120', 'unique:tenants,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'occupation' => ['required', 'string', 'max:120'],
            'monthly_income' => ['required', 'numeric', 'min:0'],
            'address_line' => ['required', 'string', 'max:180'],
            'address_number' => ['required', 'string', 'max:20'],
            'address_complement' => ['nullable', 'string', 'max:120'],
            'address_neighborhood' => ['required', 'string', 'max:120'],
            'address_city' => ['required', 'string', 'max:120'],
            'address_state' => ['required', 'string', 'max:40'],
            'address_postal_code' => ['required', 'string', 'max:12'],
            'document_last4' => ['nullable', 'digits:4'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'status' => ['nullable', 'in:active,inactive'],
            'created_by' => ['nullable', 'string', 'max:120'],
            'updated_by' => ['nullable', 'string', 'max:120'],
            'data_redacted_at' => ['nullable', 'date'],
        ];
    }
}
