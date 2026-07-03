import React from "react";
import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { MonthlyAssessmentReportData } from "@/lib/assessment-report";
import { getQualityApplicableCount, getQualityIndexes, IMR_INDICATORS, QUALITY_QUESTIONS } from "@/lib/assessments";
import {
  REPORT_CONTRACT_CODE,
  REPORT_CONTRACTOR_NAME,
  REPORT_DEFAULT_COMMENT,
  REPORT_MANAGER_NAME,
  REPORT_ORGANIZATION_UNIT,
} from "@/lib/constants";
import { formatCurrencyBRL } from "@/lib/utils";

const styles = StyleSheet.create({
  page: {
    padding: 28,
    fontSize: 10,
    color: "#1f2937",
    fontFamily: "Helvetica",
  },
  header: {
    marginBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: 700,
  },
  kicker: {
    fontSize: 9,
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "#6b7280",
  },
  badge: {
    marginTop: 8,
    alignSelf: "flex-start",
    backgroundColor: "#dff3e6",
    color: "#0f6c3b",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    fontSize: 9,
    fontWeight: 700,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 4,
    color: "#4b5563",
  },
  section: {
    marginTop: 14,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 700,
    marginBottom: 8,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 6,
    padding: 8,
  },
  cardLabel: {
    color: "#6b7280",
    fontSize: 9,
  },
  cardValue: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: 700,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  rowLabel: {
    color: "#4b5563",
  },
  rowValue: {
    fontWeight: 600,
  },
  table: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    borderBottomWidth: 1,
    borderBottomColor: "#d1d5db",
    paddingVertical: 6,
    paddingHorizontal: 6,
    fontWeight: 700,
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 5,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  cellName: {
    width: "20%",
    paddingRight: 6,
  },
  cellSmall: {
    width: "10%",
    textAlign: "right",
  },
  cellMedium: {
    width: "12%",
    textAlign: "right",
  },
  journeyCard: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  journeyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  journeyTitle: {
    fontSize: 11,
    fontWeight: 700,
  },
  miniTableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9fafb",
    paddingVertical: 5,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  miniTableRow: {
    flexDirection: "row",
    paddingVertical: 4,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  miniDate: {
    width: "16%",
  },
  miniWide: {
    width: "24%",
  },
  miniMedium: {
    width: "14%",
    textAlign: "right",
  },
  miniStatus: {
    width: "12%",
    textAlign: "right",
  },
  muted: {
    color: "#6b7280",
  },
  questionRow: {
    flexDirection: "row",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    gap: 8,
  },
  questionLabel: {
    width: "82%",
  },
  questionValue: {
    width: "18%",
    textAlign: "right",
    fontWeight: 700,
  },
  metricCard: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    padding: 8,
    marginBottom: 10,
  },
  metricTitle: {
    fontSize: 11,
    fontWeight: 700,
    marginBottom: 6,
  },
  metricLine: {
    fontSize: 9,
    marginBottom: 3,
    color: "#374151",
  },
});

function qualityLabel(value?: string) {
  switch (value) {
    case "O":
      return "Ótimo";
    case "B":
      return "Bom";
    case "R":
      return "Regular";
    case "I":
      return "Insatisfatório";
    default:
      return "Não se aplica";
  }
}

export function AssessmentReportPdf({ report }: { report: MonthlyAssessmentReportData }) {
  const { activeAssessment } = report;
  const qualityApplicableCount = getQualityApplicableCount(activeAssessment.qualityCounts);
  const qualityIndexes = getQualityIndexes(activeAssessment.qualityCounts);

  return (
    <Document>
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.kicker}>Plataforma oficial</Text>
          <Text style={styles.title}>IFC FISCALIZA</Text>
          <Text style={styles.badge}>FISCALIZAÇÃO DE CONTRATO DE LIMPEZA</Text>
          <Text style={styles.subtitle}>Relatório oficial de avaliação, IMR e jornada</Text>
          <Text style={styles.subtitle}>Instituto Federal Catarinense | Campus São Bento do Sul</Text>
          <Text style={styles.subtitle}>Referência: {activeAssessment.displayMonthLabel}</Text>
          <Text style={styles.subtitle}>Órgão/Unidade: {REPORT_ORGANIZATION_UNIT}</Text>
          <Text style={styles.subtitle}>Contrato: {REPORT_CONTRACT_CODE}</Text>
          <Text style={styles.subtitle}>Gestor/Responsável: {REPORT_MANAGER_NAME}</Text>
          <Text style={styles.subtitle}>Contratada: {REPORT_CONTRACTOR_NAME}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo Executivo</Text>
          <View style={styles.grid}>
            <View style={styles.card}><Text style={styles.cardLabel}>Nota total IMR</Text><Text style={styles.cardValue}>{activeAssessment.totalScore.toFixed(2)}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>Fator de serviço</Text><Text style={styles.cardValue}>{activeAssessment.serviceLevelFactor.toFixed(2)}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>Valor após IMR</Text><Text style={styles.cardValue}>{formatCurrencyBRL(activeAssessment.valueAfterImr)}</Text></View>
            <View style={styles.card}><Text style={styles.cardLabel}>Valor final a faturar</Text><Text style={styles.cardValue}>{formatCurrencyBRL(activeAssessment.finalAmount)}</Text></View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Indicadores e Apuração Financeira</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>IND1 | Uso dos EPI's e Uniformes</Text><Text style={styles.rowValue}>{activeAssessment.indicator1Occurrences} ocorrência(s) | {activeAssessment.indicator1Score.toFixed(2)}/10.00</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>IND2 | Tempo de Respostas às Solicitações</Text><Text style={styles.rowValue}>{activeAssessment.indicator2Occurrences} ocorrência(s) | {activeAssessment.indicator2Score.toFixed(2)}/10.00</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>IND3 | Atraso no Pagamento de Salários e Benefícios</Text><Text style={styles.rowValue}>{activeAssessment.indicator3Occurrences} ocorrência(s) | {activeAssessment.indicator3Score.toFixed(2)}/35.00</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>IND4 | Falta de Materiais Previstos em Contrato</Text><Text style={styles.rowValue}>{activeAssessment.indicator4Occurrences} ocorrência(s) | {activeAssessment.indicator4Score.toFixed(2)}/20.00</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>IND5 | Qualidade dos Serviços Prestados</Text><Text style={styles.rowValue}>{qualityApplicableCount} quesito(s) | {activeAssessment.qualityDisplayScore.toFixed(2)}/25.00</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Comentário</Text><Text style={styles.rowValue}>{REPORT_DEFAULT_COMMENT}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Contrato com VT</Text><Text style={styles.rowValue}>{formatCurrencyBRL(activeAssessment.contractMonthlyWithVt)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Desconto VT</Text><Text style={styles.rowValue}>{formatCurrencyBRL(activeAssessment.vtDiscountAmount)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Desconto creche</Text><Text style={styles.rowValue}>{formatCurrencyBRL(activeAssessment.crecheDiscountAmount)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Glosa total de jornada</Text><Text style={styles.rowValue}>{formatCurrencyBRL(activeAssessment.journeyGlosaTotal)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Desconto total estimado</Text><Text style={styles.rowValue}>{formatCurrencyBRL(activeAssessment.estimatedDiscount)}</Text></View>
        </View>

        <View style={styles.section} wrap={false}>
          <Text style={styles.sectionTitle}>Pesquisa de Qualidade</Text>
          <View style={styles.row}><Text style={styles.rowLabel}>Ótimo</Text><Text style={styles.rowValue}>{activeAssessment.qualityCounts.O}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Bom</Text><Text style={styles.rowValue}>{activeAssessment.qualityCounts.B}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Regular</Text><Text style={styles.rowValue}>{activeAssessment.qualityCounts.R}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Insatisfatório</Text><Text style={styles.rowValue}>{activeAssessment.qualityCounts.I}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Não se aplica</Text><Text style={styles.rowValue}>{activeAssessment.qualityCounts.N}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Quesitos avaliados</Text><Text style={styles.rowValue}>{qualityApplicableCount}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Índice Ótimo</Text><Text style={styles.rowValue}>{qualityIndexes.O.toFixed(2)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Índice Bom</Text><Text style={styles.rowValue}>{qualityIndexes.B.toFixed(2)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Índice Regular</Text><Text style={styles.rowValue}>{qualityIndexes.R.toFixed(2)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Índice Insatisfatório</Text><Text style={styles.rowValue}>{qualityIndexes.I.toFixed(2)}</Text></View>
          <View style={styles.row}><Text style={styles.rowLabel}>Pontuação de qualidade</Text><Text style={styles.rowValue}>{activeAssessment.qualityDisplayScore.toFixed(2)}/25.00</Text></View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Métricas Oficiais do IMR</Text>
          {IMR_INDICATORS.map((indicator) => (
            <View key={indicator.code} style={styles.metricCard}>
              <Text style={styles.metricTitle}>{indicator.code} | {indicator.title}</Text>
              <Text style={styles.metricLine}>Finalidade: {indicator.finalidade}</Text>
              <Text style={styles.metricLine}>Meta a cumprir: {indicator.target}</Text>
              <Text style={styles.metricLine}>Instrumento de medição: {indicator.measurementInstrument}</Text>
              <Text style={styles.metricLine}>Periodicidade: {indicator.periodicity}</Text>
              <Text style={styles.metricLine}>Métrica no relatório: {indicator.reportMetric}</Text>
              <Text style={styles.metricLine}>Faixa de pontuação: {indicator.scoreBands.join(" | ")}</Text>
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Questionário Respondido</Text>
          {QUALITY_QUESTIONS.map((question) => (
            <View key={question.key} style={styles.questionRow}>
              <Text style={styles.questionLabel}>{question.section} - {question.label}</Text>
              <Text style={styles.questionValue}>{qualityLabel(activeAssessment.qualityResponses[question.key])}</Text>
            </View>
          ))}
        </View>
      </Page>

      <Page size="A4" style={styles.page} wrap>
        <View style={styles.header}>
          <Text style={styles.title}>Relatório de Jornada por Funcionária</Text>
          <Text style={styles.subtitle}>Resumo mensal e detalhamento diário com base nas batidas registradas</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumo por Funcionária</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.cellName}>Funcionária</Text>
              <Text style={styles.cellSmall}>Úteis</Text>
              <Text style={styles.cellSmall}>Reg.</Text>
              <Text style={styles.cellSmall}>Compl.</Text>
              <Text style={styles.cellSmall}>Incomp.</Text>
              <Text style={styles.cellMedium}>Min. trab.</Text>
              <Text style={styles.cellMedium}>Min. falt.</Text>
              <Text style={styles.cellMedium}>Conform.</Text>
              <Text style={styles.cellMedium}>Glosa</Text>
            </View>
            {activeAssessment.items.map((item) => (
              <View key={item.employeeId} style={styles.tableRow}>
                <Text style={styles.cellName}>{item.employeeName}</Text>
                <Text style={styles.cellSmall}>{item.expectedDays}</Text>
                <Text style={styles.cellSmall}>{item.workedDays}</Text>
                <Text style={styles.cellSmall}>{item.completeDays}</Text>
                <Text style={styles.cellSmall}>{item.incompleteDays}</Text>
                <Text style={styles.cellMedium}>{item.workedMinutes}</Text>
                <Text style={styles.cellMedium}>{item.missingMinutes}</Text>
                <Text style={styles.cellMedium}>{item.complianceScore.toFixed(2)}%</Text>
                <Text style={styles.cellMedium}>{formatCurrencyBRL(item.journeyGlosaAmount)}</Text>
              </View>
            ))}
          </View>
        </View>
      </Page>

      {activeAssessment.items.map((item) => (
        <Page key={item.employeeId} size="A4" style={styles.page} wrap>
          <View style={styles.header}>
            <Text style={styles.title}>{item.employeeName}</Text>
            <Text style={styles.subtitle}>Espelho de jornada do mês {activeAssessment.displayMonthLabel}</Text>
            <Text style={styles.subtitle}>Conformidade: {item.complianceScore.toFixed(2)}% | Glosa: {formatCurrencyBRL(item.journeyGlosaAmount)}</Text>
          </View>

          <View style={styles.journeyCard}>
            <View style={styles.journeyHeader}>
              <Text style={styles.journeyTitle}>Resumo mensal</Text>
              <Text style={styles.muted}>{item.workedDays} dia(s) com registro</Text>
            </View>
            <View style={styles.row}><Text style={styles.rowLabel}>Dias úteis esperados</Text><Text style={styles.rowValue}>{item.expectedDays}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Dias completos</Text><Text style={styles.rowValue}>{item.completeDays}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Dias incompletos</Text><Text style={styles.rowValue}>{item.incompleteDays}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Minutos trabalhados</Text><Text style={styles.rowValue}>{item.workedMinutes}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Minutos faltantes</Text><Text style={styles.rowValue}>{item.missingMinutes}</Text></View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Batidas e apuração diária</Text>
            <View style={styles.table}>
              <View style={styles.miniTableHeader}>
                <Text style={styles.miniDate}>Data</Text>
                <Text style={styles.miniWide}>Entradas</Text>
                <Text style={styles.miniWide}>Saídas</Text>
                <Text style={styles.miniMedium}>Trab.</Text>
                <Text style={styles.miniMedium}>Falta</Text>
                <Text style={styles.miniStatus}>Status</Text>
              </View>
              {item.days.length > 0 ? (
                item.days.map((day) => (
                  <View key={day.workDate} style={styles.miniTableRow}>
                    <Text style={styles.miniDate}>{day.dateLabel}</Text>
                    <Text style={styles.miniWide}>{day.entryTimes.join(", ") || "-"}</Text>
                    <Text style={styles.miniWide}>{day.exitTimes.join(", ") || "-"}</Text>
                    <Text style={styles.miniMedium}>{day.workedHoursLabel}</Text>
                    <Text style={styles.miniMedium}>{day.missingHoursLabel}</Text>
                    <Text style={styles.miniStatus}>{day.statusLabel}</Text>
                  </View>
                ))
              ) : (
                <View style={styles.miniTableRow}>
                  <Text>Nenhuma batida registrada no período.</Text>
                </View>
              )}
            </View>
          </View>
        </Page>
      ))}
    </Document>
  );
}
