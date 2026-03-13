<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class PropertySearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'state' => ['nullable', 'in:SC'],
            'city' => ['nullable', 'string', 'max:120'],
            'price_range' => ['nullable', 'in:ate_1000,1001_2000,2001_3000,acima_3000'],
            'bedrooms' => ['nullable', 'integer', 'min:0', 'max:10'],
            'garage' => ['nullable', 'boolean'],
            'property_type' => ['nullable', 'in:kitnet,casa,apartamento,casa_condominio'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:50'],
        ];
    }
}
