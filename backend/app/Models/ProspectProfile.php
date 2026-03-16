<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProspectProfile extends Model
{
    use HasFactory;

    public const BEHAVIORAL_ANSWER_VALUES = [
        'concordo_totalmente',
        'concordo',
        'neutro',
        'discordo',
        'discordo_totalmente',
    ];

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
        'behavioral_answers',
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
        'behavioral_answers' => 'array',
        'score' => 'integer',
    ];

    public function interests()
    {
        return $this->hasMany(PropertyInterest::class, 'prospect_profile_id');
    }

    public static function behavioralQuestions(): array
    {
        return [
            'care_reflection' => [
                'label' => 'Sinto que o cuidado com o ambiente onde vivo e um reflexo direto do meu equilibrio interno e da minha autodisciplina.',
                'axis' => 'positive',
                'evaluation' => 'Cuidado com o imovel',
                'positive_note' => 'Indica mais zelo com o imovel e rotina de cuidado.',
                'risk_note' => 'Pode sinalizar menos atencao com conservacao e organizacao.',
            ],
            'quiet_refuge' => [
                'label' => 'Para mim, a casa deve ser estritamente um refugio de descanso e silencio, priorizando a privacidade em vez de reunioes sociais.',
                'axis' => 'positive',
                'evaluation' => 'Estilo de vida e ruido',
                'positive_note' => 'Sugere rotina mais discreta e menor risco de ruido recorrente.',
                'risk_note' => 'Pode indicar perfil mais social e maior exposicao a ruido.',
            ],
            'financial_commitment' => [
                'label' => 'Acredito que imprevistos financeiros sao aceitaveis, desde que a pessoa tenha uma justificativa plausivel para adiar compromissos.',
                'axis' => 'negative',
                'evaluation' => 'Renda e responsabilidade',
                'positive_note' => 'Mostra rigidez maior com prazos, contas e aluguel.',
                'risk_note' => 'Eleva o risco de flexibilizacao com pagamentos e inadimplencia.',
            ],
            'stability_focus' => [
                'label' => 'Minha rotina atual e focada quase integralmente no desenvolvimento profissional e na estabilidade do nucleo familiar imediato.',
                'axis' => 'positive',
                'evaluation' => 'Foco em trabalho e familia',
                'positive_note' => 'Aponta fase de vida mais estavel e previsivel.',
                'risk_note' => 'Pode indicar momento de maior transicao ou agitacao pessoal.',
            ],
            'visitors_sharing' => [
                'label' => 'Tenho facilidade em compartilhar meu espaco e nao me sinto desconfortavel com a presenca prolongada de visitantes ou parentes no meu dia a dia.',
                'axis' => 'negative',
                'evaluation' => 'Superlotacao',
                'positive_note' => 'Tende a manter mais controle sobre ocupacao do imovel.',
                'risk_note' => 'Aumenta o risco de trazer mais pessoas para morar sem aviso.',
            ],
            'rule_respect' => [
                'label' => 'Regras de condominio e normas de convivencia sao diretrizes fundamentais que evitam o caos e devem ser seguidas a risca, sem excecoes.',
                'axis' => 'positive',
                'evaluation' => 'Convivencia e autoridade',
                'positive_note' => 'Indica melhor aderencia a regras e menor chance de atrito.',
                'risk_note' => 'Pode sinalizar resistencia a regras e questionamento frequente de normas.',
            ],
            'preventive_maintenance' => [
                'label' => 'Sinto um desconforto imediato ao notar pequenos danos, como um risco na parede ou uma infiltracao, e busco resolver o problema no mesmo instante.',
                'axis' => 'positive',
                'evaluation' => 'Manutencao preventiva',
                'positive_note' => 'Favorece aviso precoce e manutencao antes do problema crescer.',
                'risk_note' => 'Pode levar a demora no aviso e desgaste maior do imovel.',
            ],
        ];
    }

    public static function behavioralAnswersFromPayload(array $data): array
    {
        $answers = [];

        foreach (array_keys(self::behavioralQuestions()) as $field) {
            $value = $data[$field] ?? null;
            if ($value !== null && $value !== '') {
                $answers[$field] = $value;
            }
        }

        return $answers;
    }

    public static function hasCompleteBehavioralAnswers(array $answers): bool
    {
        $requiredFields = array_keys(self::behavioralQuestions());

        foreach ($requiredFields as $field) {
            if (empty($answers[$field])) {
                return false;
            }
        }

        return true;
    }

    public static function scoreFromBehavioralAnswers(array $answers): int
    {
        $definitions = self::behavioralQuestions();
        $scoreMap = [
            'concordo_totalmente' => 5,
            'concordo' => 4,
            'neutro' => 3,
            'discordo' => 2,
            'discordo_totalmente' => 1,
        ];

        $total = 0;
        foreach ($definitions as $field => $definition) {
            $value = $scoreMap[$answers[$field] ?? 'neutro'] ?? 3;
            $total += $definition['axis'] === 'negative' ? 6 - $value : $value;
        }

        $min = count($definitions);
        $max = count($definitions) * 5;

        return (int) round((($total - $min) / max(1, $max - $min)) * 100);
    }

    public static function summarizeBehavioralAnswers(?array $answers): array
    {
        $answers ??= [];
        $definitions = self::behavioralQuestions();
        $labels = [
            'concordo_totalmente' => 'Concordo totalmente',
            'concordo' => 'Concordo',
            'neutro' => 'Neutro',
            'discordo' => 'Discordo',
            'discordo_totalmente' => 'Discordo totalmente',
        ];
        $positiveAnswers = ['concordo_totalmente', 'concordo'];
        $negativeAnswers = ['discordo_totalmente', 'discordo'];

        $summary = [];
        foreach ($definitions as $field => $definition) {
            $answer = $answers[$field] ?? null;
            if (!$answer) {
                continue;
            }

            $isPositiveSignal = $definition['axis'] === 'negative'
                ? in_array($answer, $negativeAnswers, true)
                : in_array($answer, $positiveAnswers, true);

            $summary[] = [
                'field' => $field,
                'question' => $definition['label'],
                'evaluation' => $definition['evaluation'],
                'answer' => $labels[$answer] ?? $answer,
                'note' => $isPositiveSignal ? $definition['positive_note'] : $definition['risk_note'],
            ];
        }

        return $summary;
    }

    public static function legacyProbabilitiesFromBehavioralAnswers(array $answers): array
    {
        return [
            'payment_probability' => self::probabilityFromBehavioralAnswer($answers['financial_commitment'] ?? 'neutro', true),
            'care_probability' => self::probabilityFromBehavioralAnswer($answers['care_reflection'] ?? 'neutro'),
            'income_stability_probability' => self::probabilityFromBehavioralAnswer($answers['stability_focus'] ?? 'neutro'),
            'neighbor_relation_probability' => self::probabilityFromBehavioralAnswer($answers['rule_respect'] ?? 'neutro'),
        ];
    }

    private static function probabilityFromBehavioralAnswer(string $answer, bool $reverse = false): string
    {
        $map = [
            'concordo_totalmente' => 'muito_provavel',
            'concordo' => 'provavel',
            'neutro' => 'pouco_provavel',
            'discordo' => 'improvavel',
            'discordo_totalmente' => 'improvavel',
        ];

        $reverseMap = [
            'concordo_totalmente' => 'improvavel',
            'concordo' => 'pouco_provavel',
            'neutro' => 'pouco_provavel',
            'discordo' => 'provavel',
            'discordo_totalmente' => 'muito_provavel',
        ];

        return ($reverse ? $reverseMap : $map)[$answer] ?? 'pouco_provavel';
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
