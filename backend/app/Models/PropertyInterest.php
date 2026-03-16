<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PropertyInterest extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_id',
        'prospect_profile_id',
        'analysis_fee',
        'payment_status',
        'payment_reference',
        'pix_copy_paste',
        'pix_qr_payload',
        'paid_at',
        'profile_access_token',
        'central_notified_at',
        'landlord_decision',
        'landlord_notes',
        'hidden_for_prospect',
        'contact_requested_at',
        'rejected_at',
        'contract_ready_at',
    ];

    protected $casts = [
        'analysis_fee' => 'decimal:2',
        'paid_at' => 'datetime',
        'central_notified_at' => 'datetime',
        'hidden_for_prospect' => 'boolean',
        'contact_requested_at' => 'datetime',
        'rejected_at' => 'datetime',
        'contract_ready_at' => 'datetime',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function profile()
    {
        return $this->belongsTo(ProspectProfile::class, 'prospect_profile_id');
    }

    public function contract()
    {
        return $this->hasOne(Contract::class, 'property_interest_id');
    }

    public function visit()
    {
        return $this->hasOne(VisitSchedule::class, 'property_interest_id');
    }
}
