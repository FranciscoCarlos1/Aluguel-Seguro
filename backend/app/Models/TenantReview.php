<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TenantReview extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'landlord_id',
        'rating',
        'payment_history',
        'stay_duration_months',
        'neighbor_relations',
        'property_care',
        'noise_level',
        'would_rent_again',
        'comment',
        'created_by_name',
        'created_by_role',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'rating' => 'integer',
        'stay_duration_months' => 'integer',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function landlord()
    {
        return $this->belongsTo(Landlord::class);
    }
}
