<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TenantReviewMedia extends Model
{
    use HasFactory;

    protected $fillable = [
        'tenant_review_id',
        'media_type',
        'url',
    ];

    public function review()
    {
        return $this->belongsTo(TenantReview::class, 'tenant_review_id');
    }
}
