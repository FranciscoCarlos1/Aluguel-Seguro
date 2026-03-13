<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Contract;
use App\Models\PaymentSlip;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PaymentSlipController extends Controller
{
    public function generate(Request $request)
    {
        $data = $request->validate([
            'contract_id' => 'required|exists:contracts,id',
            'due_date' => 'required|date',
            'amount' => 'required|numeric|min:0',
        ]);

        // Simulação de geração de boleto (integração bancária real pode ser implementada depois)
        $bankSlipNumber = 'SLIP-' . now()->format('YmdHis') . '-' . Str::upper(Str::random(5));
        $pdfUrl = 'https://boletos.exemplo.com/' . $bankSlipNumber . '.pdf';
        $paymentLink = 'https://pagamento.exemplo.com/' . $bankSlipNumber;

        $slip = PaymentSlip::create([
            ...$data,
            'status' => 'pending',
            'bank_code' => '001',
            'bank_slip_number' => $bankSlipNumber,
            'pdf_url' => $pdfUrl,
            'payment_link' => $paymentLink,
        ]);

        return response()->json(['slip' => $slip], 201);
    }

    public function show(PaymentSlip $slip)
    {
        return response()->json(['slip' => $slip]);
    }

    public function markAsPaid(Request $request, PaymentSlip $slip)
    {
        if ($slip->status === 'paid') {
            return response()->json(['message' => 'Boleto já está pago.'], 400);
        }
        $slip->update([
            'status' => 'paid',
            'paid_at' => now(),
        ]);
        return response()->json(['message' => 'Boleto marcado como pago.', 'slip' => $slip]);
    }
}
