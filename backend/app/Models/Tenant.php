<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'full_name',
        'cpf',
        'rg',
        'email',
        'phone',
        'occupation',
        'monthly_income',
        'address_line',
        'address_number',
        'address_complement',
        'address_neighborhood',
        'address_city',
        'address_state',
        'address_postal_code',
        'document_last4',
        'notes',
        'status',
        'created_by',
        'updated_by',
        'data_redacted_at',
    ];

    protected $casts = [
        'monthly_income' => 'decimal:2',
        'data_redacted_at' => 'datetime',
    ];

    public function profile()
    {
        return $this->hasOne(TenantProfile::class);
    }

    public function reviews()
    {
        return $this->hasMany(TenantReview::class);
    }
}
