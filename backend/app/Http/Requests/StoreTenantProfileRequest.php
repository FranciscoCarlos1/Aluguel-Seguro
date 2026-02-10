<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantProfileRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'summary_text' => ['nullable', 'string', 'max:2000'],
            'references_text' => ['nullable', 'string', 'max:2000'],
            'notes' => ['nullable', 'string', 'max:2000'],
            'score' => ['nullable', 'integer', 'min:0', 'max:100'],
            'status' => ['nullable', 'in:draft,active,archived'],
            'consent_at' => ['nullable', 'date'],
            'consent_source' => ['nullable', 'string', 'max:120'],
            'consent_ip' => ['nullable', 'ip'],
            'consent_version' => ['nullable', 'string', 'max:50'],
            'data_retention_until' => ['nullable', 'date'],
            'created_by' => ['nullable', 'string', 'max:120'],
            'updated_by' => ['nullable', 'string', 'max:120'],
        ];
    }
}
