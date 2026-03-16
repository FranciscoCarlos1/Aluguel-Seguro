<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SupportTicket extends Model
{
    use HasFactory;

    protected $fillable = [
        'landlord_id',
        'name',
        'phone',
        'topic',
        'preferred_time',
        'notes',
        'status',
        'contact_channel',
        'created_by',
        'responded_at',
    ];

    protected $casts = [
        'responded_at' => 'datetime',
    ];

    public function landlord()
    {
        return $this->belongsTo(Landlord::class);
    }
}
