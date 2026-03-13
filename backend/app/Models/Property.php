<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Property extends Model
{
    use HasFactory;

    protected $fillable = [
        'landlord_id',
        'title',
        'city',
        'state',
        'rent_price',
        'bedrooms',
        'has_garage',
        'property_type',
        'description',
        'address_line',
        'address_number',
        'address_neighborhood',
        'is_active',
    ];

    protected $casts = [
        'rent_price' => 'decimal:2',
        'bedrooms' => 'integer',
        'has_garage' => 'boolean',
        'is_active' => 'boolean',
    ];

    public function landlord()
    {
        return $this->belongsTo(Landlord::class);
    }

    public function interests()
    {
        return $this->hasMany(PropertyInterest::class);
    }

    public function priceRange(): string
    {
        $value = (float) $this->rent_price;

        if ($value <= 1000) {
            return 'ate_1000';
        }

        if ($value <= 2000) {
            return '1001_2000';
        }

        if ($value <= 3000) {
            return '2001_3000';
        }

        return 'acima_3000';
    }
}
