<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class TenantProfile extends Model
{
    use HasFactory;
    use SoftDeletes;

    protected $fillable = [
        'tenant_id',
        'summary_text',
        'references_text',
        'notes',
        'score',
        'status',
        'consent_at',
        'consent_source',
        'consent_ip',
        'consent_version',
        'data_retention_until',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'consent_at' => 'datetime',
        'data_retention_until' => 'date',
    ];

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }
}
