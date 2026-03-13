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
    ];

    protected $casts = [
        'analysis_fee' => 'decimal:2',
        'paid_at' => 'datetime',
        'central_notified_at' => 'datetime',
    ];

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function profile()
    {
        return $this->belongsTo(ProspectProfile::class, 'prospect_profile_id');
    }
}
