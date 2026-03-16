<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class VisitSchedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'property_interest_id',
        'property_id',
        'landlord_id',
        'scheduled_for',
        'status',
        'mode',
        'operator_name',
        'notes',
        'created_by',
    ];

    protected $casts = [
        'scheduled_for' => 'datetime',
    ];

    public function interest()
    {
        return $this->belongsTo(PropertyInterest::class, 'property_interest_id');
    }

    public function property()
    {
        return $this->belongsTo(Property::class);
    }

    public function landlord()
    {
        return $this->belongsTo(Landlord::class);
    }
}
