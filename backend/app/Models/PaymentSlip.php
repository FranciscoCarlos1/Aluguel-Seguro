<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentSlip extends Model
{
    use HasFactory;

    protected $fillable = [
        'contract_id',
        'due_date',
        'amount',
        'status',
        'bank_code',
        'bank_slip_number',
        'pdf_url',
        'payment_link',
        'description',
        'installment_number',
        'installment_total',
        'paid_at',
        'fine',
        'interest',
    ];

    protected $casts = [
        'due_date' => 'date',
        'amount' => 'decimal:2',
        'installment_number' => 'integer',
        'installment_total' => 'integer',
        'paid_at' => 'datetime',
        'fine' => 'decimal:2',
        'interest' => 'decimal:2',
    ];

    public function contract()
    {
        return $this->belongsTo(Contract::class);
    }
}
