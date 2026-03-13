<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\Property;
use App\Models\Landlord;
use App\Models\Tenant;
use App\Models\PropertyInterest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class ContractController extends Controller
{
    public function generate(Request $request)
    {
        $data = $request->validate([
            'property_id' => 'required|exists:properties,id',
            'landlord_id' => 'required|exists:landlords,id',
            'tenant_id' => 'required|exists:tenants,id',
            'property_interest_id' => 'nullable|exists:property_interests,id',
            'start_date' => 'required|date',
            'end_date' => 'nullable|date|after:start_date',
            'rent_amount' => 'required|numeric|min:0',
            'deposit_amount' => 'nullable|numeric|min:0',
            'fire_insurance' => 'nullable|numeric|min:0',
            'garbage_fee' => 'nullable|numeric|min:0',
        ]);

        $contractText = $this->generateContractText($data);

        $contract = Contract::create([
            ...$data,
            'contract_text' => $contractText,
            'status' => 'draft',
        ]);

        return response()->json(['contract' => $contract], 201);
    }

    public function show(Contract $contract)
    {
        return response()->json(['contract' => $contract]);
    }

    public function sign(Request $request, Contract $contract)
    {
        $request->validate([
            'signer_ip' => 'required|ip',
        ]);

        if ($contract->status !== 'draft') {
            return response()->json(['message' => 'Contrato já assinado ou inválido.'], 400);
        }

        $signatureHash = Hash::make($contract->id . $contract->updated_at . $request->signer_ip . Str::random(10));
        $contract->update([
            'status' => 'signed',
            'signed_at' => now(),
            'signed_by_ip' => $request->signer_ip,
            'signature_hash' => $signatureHash,
        ]);

        return response()->json(['message' => 'Contrato assinado com sucesso.', 'contract' => $contract]);
    }

    private function generateContractText(array $data): string
    {
        // Aqui pode ser implementado um template dinâmico de contrato
        return "CONTRATO DE LOCAÇÃO\nLocador: {$data['landlord_id']}\nLocatário: {$data['tenant_id']}\nImóvel: {$data['property_id']}\nValor: R$ {$data['rent_amount']}\nInício: {$data['start_date']}\n";
    }
}
