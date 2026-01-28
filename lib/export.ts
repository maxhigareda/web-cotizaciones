import jsPDF from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, Table, TableRow, TableCell, BorderStyle, WidthType, ImageRun, ShadingType, AlignmentType, Header, Footer } from 'docx'
import { saveAs } from 'file-saver'
import { LOGO_NESTLE, LOGO_SI } from './logos'

// Rates for internal calculation if needed (fallback)
const RATES: Record<string, number> = {
    data_analyst: 2500,
    data_science: 5100,
    bi_developer: 4128,
    data_engineer: 4950,
    power_apps: 4000,
    react_dev: 4500,
    power_automate: 4000
}

interface QuoteState {
    clientName: string
    description: string
    complexity: string
    updateFrequency: string
    roles: Record<string, number>
    pipelinesCount: number
    notebooksCount: number
    manualProcessPct: number
    automationsCount: number
    pipelineExecutions: number
    reportsCount: number
    reportUsers: number
    isFinancialOrSales: boolean
    techStack: string[]
    dsModelsCount: number
    dashboardsCount: number
    criticitness: {
        enabled: boolean
        level: string
        impactOperative: string
        impactFinancial: string
        countriesCount: number
    }
    durationValue: number
    durationUnit: 'days' | 'weeks' | 'months'
    supportHours: 'business' | '24/7'
    serviceType?: string
    commercialDiscount?: number
    staffingDetails: {
        profiles: Array<{
            id: string
            role: string
            seniority: string
            skills: string
            count: number
            startDate: string
            endDate: string
            allocationPercentage?: number
        }>
    }
    sustainDetails: {
        solutionName: string
        technicalDescription: string
        techStack: string[]
        metrics: {
            pipelinesCount: number
            notebooksCount: number
            reportsCount: number
            dsModelsCount: number
            automationLevel: number
            updateFrequency: string
        }
        businessOwner: string
        devHours: number
        incidentRate: number
        supportWindow: string
        criticalHours: string
        criticalDays: string
        criticalityMatrix: {
            impactOperative: number
            impactFinancial: number
            userCoverage: number
            countryCoverage: number
            technicalMaturity: number
            dependencies: number
        }
    }
    retention?: {
        enabled: boolean
        percentage: number
    }
    clientContact?: {
        name: string
        role: string
        email: string
        areaLeader?: string
    }
}

export function downloadCSV(data: any[], filename: string) {
    if (!data || !data.length) return
    const separator = ','
    const keys = Object.keys(data[0])
    const csvContent =
        keys.join(separator) + '\n' +
        data.map(row => {
            return keys.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : row[k]
                cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""')
                if (cell.search(/("|,|\n)/g) >= 0) cell = `"${cell}"`
                return cell
            }).join(separator)
        }).join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${filename}.csv`)
}

// -- Blue Identity PDF --
function createPDFDocument(data: QuoteState & { totalMonthlyCost: number, l2SupportCost: number, riskCost: number, totalWithRisk: number, discountAmount: number, finalTotal: number, criticitnessLevel: any, diagramImage?: string, currency?: string, exchangeRate?: number, durationMonths: number }) {
    const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4', compress: true })

    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Corporate Blue Identity
    const COLOR_PRIMARY = '#0056D2' // Corporate Strong Blue (Estimated)
    const COLOR_CHARCOAL = '#333533'
    const COLOR_TEXT = '#454545'
    const COLOR_ROW_ALT = '#F2F6FC' // Very light blue tint for rows

    const FONT_REG = "helvetica"
    const FONT_BOLD = "helvetica"

    const currencyCode = data.currency || 'USD'
    const rateMultiplier = data.exchangeRate || 1.0
    const fmt = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2
        }).format(amount * rateMultiplier)
    }

    const durationText = () => {
        const val = Math.round(data.durationValue) === data.durationValue ? data.durationValue : data.durationValue.toFixed(1)
        return `${val} ${data.durationUnit.toUpperCase()}`
    }

    // --- Header & Footer ---
    const drawHeader = () => {
        // SI Logo Adjustment (Vertical, Maintain Ratio)
        if (LOGO_SI) {
            try {
                // Assuming vertical stack naturally or just fit height better
                const props = doc.getImageProperties(LOGO_SI)
                const h = 22 // Taller than before
                const w = (props.width * h) / props.height
                doc.addImage(LOGO_SI, 'PNG', margin, 10, w, h)
            } catch (e) { }
        }

        // Nestlé (Right)
        if (LOGO_NESTLE) {
            try {
                doc.addImage(LOGO_NESTLE, 'PNG', pageWidth - margin - 20, 10, 20, 20)
            } catch (e) { }
        }

        // Blue Divider
        doc.setDrawColor(COLOR_PRIMARY) // Blue
        doc.setLineWidth(0.8) // Thicker
        doc.line(margin, 38, pageWidth - margin, 38)
    }

    const drawFooter = (pageNum: number) => {
        doc.setFontSize(8)
        doc.setTextColor(150)
        doc.text(`Confidencial - The Store Intelligence | Pág. ${pageNum}`, margin, pageHeight - 10)
    }

    // --- PAGE 1: COVER ---
    drawHeader()

    let y = 100
    doc.setFont(FONT_BOLD, "bold")
    doc.setFontSize(32)
    doc.setTextColor(COLOR_PRIMARY) // Blue Title
    doc.text("PROPUESTA TÉCNICA", pageWidth / 2, y, { align: "center" })

    y += 15
    doc.setFontSize(16)
    doc.setTextColor(COLOR_CHARCOAL)
    doc.text("ESTIMACIÓN DE ALCANCE E INVERSIÓN", pageWidth / 2, y, { align: "center" })

    y += 50
    // Box for details (Blue Border)
    doc.setDrawColor(COLOR_PRIMARY)
    doc.setLineWidth(0.2)
    doc.rect(margin + 20, y, contentWidth - 40, 45)

    let infoY = y + 15
    const drawInfo = (label: string, value: string) => {
        doc.setFontSize(11)
        doc.setFont(FONT_REG, "normal")
        doc.setTextColor(COLOR_TEXT)
        doc.text(label, margin + 40, infoY)

        doc.setFont(FONT_BOLD, "bold")
        doc.text(value, pageWidth - margin - 40, infoY, { align: "right" })
        infoY += 12
    }

    drawInfo("Cliente:", data.clientName)
    drawInfo("Fecha:", new Date().toLocaleDateString())
    drawInfo("Referencia:", `COT-${new Date().getTime().toString().substr(-6)}`)
    // Solicitado por REMOVED

    drawFooter(1)

    // --- PAGE 2: ARCHITECTURE & STACK ---
    doc.addPage()
    drawHeader()
    y = 50

    doc.setFont(FONT_BOLD, "bold")
    doc.setFontSize(16)
    doc.setTextColor(COLOR_PRIMARY)
    doc.text("1. RESUMEN Y ARQUITECTURA", margin, y)
    y += 10

    doc.setFont(FONT_REG, "normal")
    doc.setFontSize(10)
    doc.setTextColor(COLOR_TEXT)
    const desc = data.description || "Solución tecnológica para optimización de datos."

    // Aligned Left (Fixed Rivers)
    const splitDesc = doc.splitTextToSize(desc, contentWidth)
    doc.text(splitDesc, margin, y, { align: "left", lineHeightFactor: 1.5, maxWidth: contentWidth })
    y += (splitDesc.length * 6) + 10

    // Diagram
    if (data.diagramImage) {
        doc.setFont(FONT_BOLD, "bold")
        doc.setTextColor(COLOR_CHARCOAL)
        doc.text("Diagrama de Solución:", margin, y)
        y += 8

        const imgProps = doc.getImageProperties(data.diagramImage)
        const pdfW = contentWidth * 0.9 // 90% width
        const pdfH = (imgProps.height * pdfW) / imgProps.width
        const maxH = 90
        const finalH = Math.min(pdfH, maxH)

        try {
            const imgX = margin + (contentWidth - pdfW) / 2
            doc.addImage(data.diagramImage, 'PNG', imgX, y, pdfW, finalH)
        } catch (e) {
            doc.text("[Error visualizando diagrama]", margin, y + 10)
        }
        y += finalH + 15
    }

    // TECH STACK BLOCK
    doc.setFont(FONT_BOLD, "bold")
    doc.setFontSize(12)
    doc.setTextColor(COLOR_PRIMARY)
    doc.text("STACK TECNOLÓGICO", margin, y)
    y += 8

    // Grid Setup
    const boxW = contentWidth / 2 - 5
    const boxH = 15
    const startX = margin

    // Helper Text
    const drawStackItem = (x: number, label: string, val: string) => {
        doc.setFillColor(COLOR_ROW_ALT)
        doc.rect(x, y, boxW, boxH, 'F')
        doc.setFontSize(9)
        doc.setTextColor(COLOR_TEXT)
        doc.setFont(FONT_BOLD, "bold")
        doc.text(label, x + 5, y + 6)
        doc.setFont(FONT_REG, "normal")
        doc.text(val, x + boxW - 5, y + 6, { align: "right" })
    }

    drawStackItem(startX, "Infraestructura", "Azure / AWS")
    drawStackItem(startX + boxW + 10, "Procesamiento", "Databricks / Python")
    y += boxH + 2
    drawStackItem(startX, "Visualización", "Power BI / Tableau")
    drawStackItem(startX + boxW + 10, "Almacenamiento", "Snowflake / Delta")

    drawFooter(2)

    // --- PAGE 3: BUDGET & FINANCIALS ---
    doc.addPage()
    drawHeader()
    y = 50

    doc.setFont(FONT_BOLD, "bold")
    doc.setFontSize(16)
    doc.setTextColor(COLOR_PRIMARY) // Blue Title
    doc.text("2. DETALLE DE INVERSIÓN", margin, y)
    y += 15

    // Table Header (Blue)
    doc.setFillColor(COLOR_PRIMARY)
    doc.rect(margin, y, contentWidth, 10, 'F')
    doc.setTextColor(255)
    doc.setFontSize(9)
    doc.setFont(FONT_BOLD, "bold")
    doc.text("CONCEPTO", margin + 5, y + 6)
    doc.text("DURACIÓN", pageWidth - margin - 80, y + 6, { align: 'center' })
    doc.text("MENSUAL", pageWidth - margin - 40, y + 6, { align: 'right' })
    doc.text("SUBTOTAL", pageWidth - margin - 5, y + 6, { align: 'right' })
    y += 10

    // Rows
    let isReview = true
    const drawRow = (label: string, meta: string, monthly: string, total: string) => {
        if (isReview) {
            doc.setFillColor(COLOR_ROW_ALT)
            doc.rect(margin, y, contentWidth, 10, 'F')
        }
        isReview = !isReview

        doc.setTextColor(COLOR_TEXT)
        doc.setFont(FONT_BOLD, "bold")
        doc.text(label, margin + 5, y + 6)

        doc.setFont(FONT_REG, "normal")
        doc.text(meta, pageWidth - margin - 80, y + 6, { align: 'center' })

        doc.setFont(FONT_BOLD, "bold")
        doc.text(monthly, pageWidth - margin - 40, y + 6, { align: 'right' })
        doc.text(total, pageWidth - margin - 5, y + 6, { align: 'right' })
        y += 10
    }

    if (data.serviceType === 'Staffing' || data.serviceType === 'Sustain') {
        data.staffingDetails.profiles.forEach(p => {
            const rate = RATES[Object.keys(RATES).find(k => p.role.toLowerCase().includes(k.replace('_', ' '))) || 'react_dev'] || 4000
            const alloc = (p.allocationPercentage || 100) / 100
            const sub = rate * alloc * p.count
            drawRow(p.role, `${p.count} Rec. (${p.seniority})`, fmt(sub), fmt(sub * data.durationMonths))
        })
    } else {
        Object.entries(data.roles).forEach(([role, count]) => {
            if (count > 0) {
                const rate = RATES[role] || 0
                const sub = rate * count
                drawRow(role.replace(/_/g, ' ').toUpperCase(), `${count} Rec.`, fmt(sub), fmt(sub * data.durationMonths))
            }
        })
    }

    if (data.l2SupportCost > 0) drawRow("Soporte L2", "Mensual", fmt(data.l2SupportCost), fmt(data.l2SupportCost * data.durationMonths))
    if (data.riskCost > 0) drawRow("Fee de Riesgo", `${((data.criticitnessLevel?.margin || 0) * 100).toFixed(0)}%`, fmt(data.riskCost), fmt(data.riskCost * data.durationMonths))
    if (data.discountAmount > 0) drawRow("Descuento", `${data.commercialDiscount}%`, `-${fmt(data.discountAmount)}`, `-${fmt(data.discountAmount * data.durationMonths)}`)

    // --- CONSOLIDATED TOTALS ON PAGE 3 ---
    y += 10
    // Check space
    if (y > pageHeight - 60) {
        doc.addPage()
        drawHeader()
        y = 50
    }

    // Totals Box (Blue Border)
    doc.setDrawColor(COLOR_PRIMARY)
    doc.setLineWidth(0.8)
    doc.rect(margin + 20, y, contentWidth - 40, 45)

    let ty = y + 15
    doc.setFontSize(12)
    doc.setTextColor(COLOR_TEXT)
    doc.setFont(FONT_REG, "normal")
    doc.text("Inversión Mensual:", margin + 30, ty)
    doc.setFont(FONT_BOLD, "bold")
    doc.text(fmt(data.finalTotal), pageWidth - margin - 30, ty, { align: "right" })

    ty += 15
    doc.setFontSize(14)
    doc.setTextColor(COLOR_CHARCOAL)
    doc.text(`TOTAL PROYECTO (${durationText()}):`, margin + 30, ty)
    doc.setTextColor(COLOR_PRIMARY) // Blue Highlight
    doc.setFontSize(18)
    doc.text(fmt(data.finalTotal * data.durationMonths), pageWidth - margin - 30, ty, { align: "right" })

    // Notes
    y += 55
    doc.setFontSize(9)
    doc.setTextColor(COLOR_TEXT)
    doc.setFont(FONT_REG, "normal")
    doc.text("* Valores mostrados sin IVA.", margin, y)
    if (data.retention?.enabled) {
        y += 5
        doc.text(`* Retención financiera interna del ${data.retention.percentage}% aplicada pro-forma.`, margin, y)
    }

    drawFooter(3)

    // --- PAGE 4: APPROVALS ---
    doc.addPage()
    drawHeader()
    y = 50

    doc.setFont(FONT_BOLD, "bold")
    doc.setFontSize(16)
    doc.setTextColor(COLOR_PRIMARY)
    doc.text("3. APROBACIÓN", margin, y)
    y += 20

    doc.setFont(FONT_REG, "normal")
    doc.setFontSize(10)
    doc.setTextColor(COLOR_TEXT)
    doc.text("Firma de conformidad con los términos técnicos y económicos expuestos.", margin, y)

    y += 50 // Space

    doc.setDrawColor(150)
    doc.setLineWidth(0.2)

    doc.line(margin + 10, y, margin + 80, y)
    doc.setFontSize(8)
    doc.text("Por THE STORE INTELLIGENCE", margin + 15, y + 5)

    doc.line(pageWidth - margin - 80, y, pageWidth - margin - 10, y)
    doc.text("Por EL CLIENTE", pageWidth - margin - 70, y + 5)

    drawFooter(4)

    const filename = `cotizacion_${(data.clientName || 'proyecto').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
    return doc
}

export async function exportToPDF(data: any) {
    createPDFDocument(data)
}

export async function generatePDFBlob(data: any) {
    const doc = createPDFDocument(data)
    return doc.output('blob')
}

// -- Word Export --
export async function exportToWord(data: any) {
    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({ children: [new TextRun({ text: "Propuesta Técnica (Versión Editable)", bold: true, size: 48 })] }),
                new Paragraph({ text: "Documento generado para revisión.", spacing: { after: 200 } }),
                new Paragraph({ text: `Cliente: ${data.clientName}` }),
                new Paragraph({ text: `Total: $${(data.finalTotal * data.durationMonths).toLocaleString()}` })
            ]
        }]
    })
    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `cotizacion_${(data.clientName || 'proyecto')}.docx`)
    })
}
