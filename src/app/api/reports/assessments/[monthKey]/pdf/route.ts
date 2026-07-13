import { Role } from "@prisma/client";
import { renderToBuffer } from "@react-pdf/renderer";

import { getMonthlyAssessmentReport } from "@/lib/assessment-report";
import { AssessmentReportPdf } from "@/lib/assessment-report-pdf";
import { getCurrentUser } from "@/lib/auth";

export async function GET(
  _request: Request,
  context: { params: Promise<{ monthKey: string }> },
) {
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Não autenticado.", { status: 401 });
  }

  if (![Role.ADMIN, Role.OPERATOR, Role.AUDITOR].includes(user.role)) {
    return new Response("Acesso negado.", { status: 403 });
  }

  const { monthKey } = await context.params;
  const report = await getMonthlyAssessmentReport(monthKey);
  const buffer = await renderToBuffer(AssessmentReportPdf({ report }));
  const pdfBytes = new Uint8Array(buffer);
  const fileName = `ifc-fiscaliza-relatorio-${report.activeAssessment.monthKey}.pdf`;

  return new Response(pdfBytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${fileName}"`,
      "Cache-Control": "no-store",
    },
  });
}
