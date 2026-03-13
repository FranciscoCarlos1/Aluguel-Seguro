<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProspectProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'full_name',
        'phone',
        'email',
        'occupation',
        'monthly_income',
        'household_size',
        'has_pet',
        'rental_reason',
        'additional_notes',
        'payment_probability',
        'care_probability',
        'income_stability_probability',
        'neighbor_relation_probability',
        'score',
    ];

    protected $casts = [
        'monthly_income' => 'decimal:2',
        'household_size' => 'integer',
        'has_pet' => 'boolean',
        'score' => 'integer',
    ];

    public function interests()
    {
        return $this->hasMany(PropertyInterest::class, 'prospect_profile_id');
    }

    public static function scoreFromProbabilities(array $data): int
    {
        $map = [
            'muito_provavel' => 25,
            'provavel' => 18,
            'pouco_provavel' => 10,
            'improvavel' => 4,
        ];

        $fields = [
            'payment_probability',
            'care_probability',
            'income_stability_probability',
            'neighbor_relation_probability',
        ];

        $score = 0;
        foreach ($fields as $field) {
            $score += $map[$data[$field] ?? 'improvavel'] ?? 0;
        }

        return max(0, min($score, 100));
    }
}
