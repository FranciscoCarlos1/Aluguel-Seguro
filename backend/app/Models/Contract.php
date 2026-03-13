<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Contract extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'landlord_id',
        'tenant_id',
        'property_interest_id',
        'start_date',
        'end_date',
        'rent_amount',
        'deposit_amount',
        'fire_insurance',
        'garbage_fee',
        'status',
        'contract_text',
        'signed_at',
        'signed_by_ip',
        'signature_hash',
    ];

    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'rent_amount' => 'decimal:2',
        'deposit_amount' => 'decimal:2',
        'fire_insurance' => 'decimal:2',
        'garbage_fee' => 'decimal:2',
        'signed_at' => 'datetime',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function landlord()
    {
        return $this->belongsTo(Landlord::class);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function interest()
    {
        return $this->belongsTo(PropertyInterest::class, 'property_interest_id');
    }
}
