<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class PaymentSlipResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'contract_id' => $this->contract_id,
            'due_date' => $this->due_date,
            'amount' => $this->amount,
            'status' => $this->status,
            'bank_code' => $this->bank_code,
            'bank_slip_number' => $this->bank_slip_number,
            'pdf_url' => $this->pdf_url,
            'payment_link' => $this->payment_link,
            'description' => $this->description,
            'installment_number' => $this->installment_number,
            'installment_total' => $this->installment_total,
            'paid_at' => $this->paid_at,
            'fine' => $this->fine,
            'interest' => $this->interest,
            'created_at' => $this->created_at,
        ];
    }
}
