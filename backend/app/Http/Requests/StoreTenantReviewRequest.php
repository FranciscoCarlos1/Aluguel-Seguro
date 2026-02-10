<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreTenantReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'landlord_id' => ['nullable', 'exists:landlords,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'payment_history' => ['required', 'in:on_time,late,defaulted'],
            'stay_duration_months' => ['required', 'integer', 'min:1', 'max:600'],
            'neighbor_relations' => ['required', 'in:good,average,bad'],
            'property_care' => ['required', 'in:good,average,bad'],
            'noise_level' => ['required', 'in:low,medium,high'],
            'would_rent_again' => ['required', 'in:yes,no'],
            'comment' => ['nullable', 'string', 'max:2000'],
            'created_by_name' => ['nullable', 'string', 'max:120'],
            'created_by_role' => ['nullable', 'string', 'max:80'],
            'created_by' => ['nullable', 'string', 'max:120'],
            'updated_by' => ['nullable', 'string', 'max:120'],
        ];
    }
}
