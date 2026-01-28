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

// -- CSV Export --
export function downloadCSV(data: any[], filename: string) {
    if (!data || !data.length) return

    const separator = ','
    const keys = Object.keys(data[0])
    const csvContent =
        keys.join(separator) +
        '\n' +
        data.map(row => {
            return keys.map(k => {
                let cell = row[k] === null || row[k] === undefined ? '' : row[k]
                cell = cell instanceof Date ? cell.toLocaleString() : cell.toString().replace(/"/g, '""')
                if (cell.search(/("|,|\n)/g) >= 0) {
                    cell = `"${cell}"`
                }
                return cell
            }).join(separator)
        }).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    saveAs(blob, `${filename}.csv`)
}

// -- Shared PDF Logic (Redesigned) --
function createPDFDocument(data: QuoteState & { totalMonthlyCost: number, l2SupportCost: number, riskCost: number, totalWithRisk: number, discountAmount: number, finalTotal: number, criticitnessLevel: any, diagramImage?: string, currency?: string, exchangeRate?: number, durationMonths: number }) {
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
        compress: true
    })

    const pageWidth = doc.internal.pageSize.width
    const pageHeight = doc.internal.pageSize.height
    const margin = 20
    const contentWidth = pageWidth - (margin * 2)

    // Colors
    const COLOR_HEADER = '#1A1A1A' // Charcoal Solid
    const COLOR_ACCENT = '#D4AF37' // Gold
    const COLOR_TEXT_DARK = '#333333'
    const COLOR_TEXT_LIGHT = '#666666'
    const COLOR_ROW_EVEN = '#F4F4F4' // Very light gray
    const COLOR_ROW_ODD = '#FFFFFF'
    const COLOR_TOTAL_BG = '#E8F6F6' // Cyan-ish tint (similar to ref but subtle) or use Gold tint? User said "similar to cyan button". Let's stick to our Gold brand but use a tint.
    // Actually user said "similar al botón cian de la referencia". I'll use a very subtle gray/gold mix or just the accent color for text.
    // Let's go with a solid box for Total Project.

    // Fonts
    const FONT_MAIN = "helvetica"

    // Helpers
    const currencyCode = data.currency || 'USD'
    const rateMultiplier = data.exchangeRate || 1.0
    const fmt = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2
        }).format(amount * rateMultiplier)
    }

    const drawHeader = () => {
        // Solid Header Block
        doc.setFillColor(COLOR_HEADER)
        doc.rect(0, 0, pageWidth, 40, 'F')

        // Title
        doc.setFont(FONT_MAIN, "bold")
        doc.setFontSize(24)
        doc.setTextColor(255, 255, 255)
        doc.text("PROPUESTA COMERCIAL", margin, 28)

        // SI Logo (White/Overlay) - In Top Right
        // We use the same logo but if it has transparency it works on dark.
        if (LOGO_SI) {
            try {
                // Resize for header
                doc.addImage(LOGO_SI, 'PNG', pageWidth - margin - 50, 8, 50, 24)
            } catch (e) { }
        }
    }

    const drawFooter = () => {
        // Thin strip at bottom
        doc.setFillColor(COLOR_HEADER)
        doc.rect(0, pageHeight - 12, pageWidth, 12, 'F')

        doc.setFontSize(8)
        doc.setTextColor(200, 200, 200)
        doc.text("The Store Intelligence  |  www.storeintelligence.com  |  Confidencial", pageWidth / 2, pageHeight - 5, { align: "center" })
    }

    // --- PAGE 1: COVER & SUMMARY ---
    drawHeader()

    let y = 60

    // Client Logo / Info Section
    if (LOGO_NESTLE) {
        try {
            doc.addImage(LOGO_NESTLE, 'PNG', margin, y, 30, 30) // Nestlé Highlighted
        } catch (e) { }
    }

    // Client Details (Right aligned next to logo?)
    // User asked "Nestlé como cliente destacado".

    // Metadata block
    const metaX = margin + 40
    doc.setFont(FONT_MAIN, "normal")
    doc.setFontSize(10)
    doc.setTextColor(COLOR_TEXT_LIGHT)
    doc.text("PREPARADO PARA:", metaX, y + 5)

    doc.setFont(FONT_MAIN, "bold")
    doc.setFontSize(14)
    doc.setTextColor(COLOR_TEXT_DARK)
    doc.text(data.clientName || 'Cliente Confidencial', metaX, y + 12)

    doc.setFont(FONT_MAIN, "normal")
    doc.setFontSize(10)
    doc.setTextColor(COLOR_TEXT_LIGHT)
    doc.text(`Fecha: ${new Date().toLocaleDateString()}`, metaX, y + 20)
    if (data.clientContact?.name) {
        doc.text(`Attn: ${data.clientContact.name}`, metaX, y + 26)
    }

    y += 50

    // 1. Executive Summary
    doc.setFont(FONT_MAIN, "bold")
    doc.setFontSize(12)
    doc.setTextColor(COLOR_ACCENT) // Gold Headers
    doc.text("RESUMEN EJECUTIVO", margin, y)
    y += 8

    doc.setDrawColor(200)
    doc.setLineWidth(0.1)
    doc.line(margin, y, pageWidth - margin, y) // Divider
    y += 8

    doc.setFont(FONT_MAIN, "normal")
    doc.setFontSize(10)
    doc.setTextColor(COLOR_TEXT_DARK)

    const desc = data.description && data.description.length > 5 ? data.description : "Propuesta de servicios profesionales."
    const splitDesc = doc.splitTextToSize(desc, contentWidth)
    doc.text(splitDesc, margin, y, { lineHeightFactor: 1.5, align: "justify", maxWidth: contentWidth })

    y += (splitDesc.length * 6) + 15

    // Scope Metrics (Grid)
    doc.setFont(FONT_MAIN, "bold")
    doc.setFontSize(12)
    doc.setTextColor(COLOR_ACCENT)
    doc.text("ALCANCE Y MÉTRICAS", margin, y)
    y += 8
    doc.line(margin, y, pageWidth - margin, y)
    y += 10

    // Simple Grid for Metrics
    const metrics: string[] = []
    if (data.serviceType === 'Proyecto') {
        metrics.push(`Complejidad: ${data.complexity}`)
        metrics.push(`Pipelines: ${data.pipelinesCount}`)
        metrics.push(`Notebooks: ${data.notebooksCount}`)
        metrics.push(`Modelos ML: ${data.dsModelsCount}`)
    } else {
        metrics.push(`Servicio: ${data.serviceType}`)
        metrics.push(`Perfiles: ${data.staffingDetails.profiles.reduce((a, b) => a + b.count, 0)}`)
    }

    // Draw little boxes or just list
    let mx = margin
    doc.setFontSize(10)
    doc.setTextColor(COLOR_TEXT_DARK)
    metrics.forEach(m => {
        doc.setFillColor(COLOR_ROW_EVEN)
        doc.rect(mx, y, 40, 15, 'F') // box
        doc.text(m, mx + 20, y + 9, { align: 'center' })
        mx += 45
    })

    y += 30

    drawFooter()

    // --- PAGE 2: COST ESTIMATION (The "Quotation" Design) ---
    doc.addPage()
    drawHeader()
    y = 50

    doc.setFont(FONT_MAIN, "bold")
    doc.setFontSize(14)
    doc.setTextColor(COLOR_HEADER)
    doc.text("DETALLE DE INVERSIÓN (ESTIMADO)", margin, y)
    y += 10

    // Table Header
    const colDescX = margin + 2
    const colDuraX = pageWidth - margin - 70 // Center-ish
    const colPriceX = pageWidth - margin - 35
    const colTotalX = pageWidth - margin - 2

    const rowH = 10

    // Header Row (Solid Color)
    doc.setFillColor(COLOR_HEADER)
    doc.rect(margin, y, contentWidth, rowH, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(9)
    doc.setFont(FONT_MAIN, "bold")

    doc.text("DESCRIPCIÓN", colDescX, y + 6.5)
    doc.text("DURACIÓN/CANT.", colDuraX, y + 6.5, { align: 'center' })
    doc.text("MENSUAL", colPriceX, y + 6.5, { align: 'right' })
    doc.text("TOTAL", colTotalX, y + 6.5, { align: 'right' })

    y += rowH

    // Helper to draw clean rows
    let isOdd = true
    const drawRow = (desc: string, duration: string, monthly: string, total: string) => {
        doc.setFillColor(isOdd ? COLOR_ROW_ODD : COLOR_ROW_EVEN)
        doc.rect(margin, y, contentWidth, rowH, 'F')

        doc.setTextColor(COLOR_TEXT_DARK)
        doc.setFont(FONT_MAIN, "normal")

        doc.text(desc, colDescX, y + 6.5)
        doc.text(duration, colDuraX, y + 6.5, { align: 'center' })
        doc.text(monthly, colPriceX, y + 6.5, { align: 'right' })
        doc.text(total, colTotalX, y + 6.5, { align: 'right' })

        y += rowH
        isOdd = !isOdd
    }

    // Populate Data
    if (data.serviceType === 'Staffing' || data.serviceType === 'Sustain') {
        data.staffingDetails.profiles.forEach(p => {
            const rate = RATES[Object.keys(RATES).find(k => p.role.toLowerCase().includes(k.replace('_', ' '))) || 'react_dev'] || 4000
            const alloc = (p.allocationPercentage || 100) / 100
            const sub = rate * alloc * p.count
            drawRow(
                `${p.role} (${p.seniority})`,
                `${p.count} Rec.`,
                fmt(sub),
                fmt(sub * data.durationMonths)
            )
        })
    } else {
        Object.entries(data.roles).forEach(([role, count]) => {
            if (count > 0) {
                const rate = RATES[role] || 0
                const monthly = rate * count
                drawRow(
                    role.replace(/_/g, ' ').toUpperCase(),
                    `${count} Rec.`,
                    fmt(monthly),
                    fmt(monthly * data.durationMonths)
                )
            }
        })
    }

    // Totals Block
    y += 10

    // Check space
    if (y > pageHeight - 60) {
        doc.addPage()
        drawHeader()
        y = 50
    }

    // Monthly Summary (Small)
    doc.setFont(FONT_MAIN, "bold")
    doc.setTextColor(COLOR_TEXT_DARK)
    doc.text("Subtotal Mensual:", pageWidth - margin - 60, y)
    doc.text(fmt(data.finalTotal), pageWidth - margin - 2, y, { align: 'right' })
    y += 15

    // TOTAL PROJECT BLOCK (Highlighted)
    doc.setFillColor(COLOR_ACCENT) // Gold block
    doc.rect(pageWidth - margin - 80, y - 5, 80, 20, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(10)

    // Clean Duration Text
    const durationClean = Math.round(data.durationValue) === data.durationValue
        ? data.durationValue.toString()
        : data.durationValue.toFixed(1)

    doc.text(`TOTAL PROYECTO (${durationClean} ${data.durationUnit.toUpperCase()})`, pageWidth - margin - 40, y + 3, { align: 'center' })

    doc.setFontSize(16)
    doc.text(fmt(data.finalTotal * data.durationMonths), pageWidth - margin - 40, y + 10, { align: 'center' })

    drawFooter()

    const filename = `cotizacion_${(data.clientName || 'proyecto').replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`
    doc.save(filename)
    return doc
}

// -- PDF Export Linker --
export async function exportToPDF(data: any) {
    createPDFDocument(data)
}

export async function generatePDFBlob(data: any) {
    const doc = createPDFDocument(data)
    return doc.output('blob')
}

// -- WORD Export (Enterprise Standard) --
export async function exportToWord(data: QuoteState & { totalMonthlyCost: number, l2SupportCost: number, riskCost: number, totalWithRisk: number, discountAmount: number, finalTotal: number, criticitnessLevel: any, diagramImage?: string, currency?: string, exchangeRate?: number, durationMonths: number }) {
    const HEX_GOLD = "D4AF37"
    const HEX_CHARCOAL = "333533"

    const doc = new Document({
        sections: [{
            properties: {
                page: {
                    margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 } // 1 inch margins (approx 2.5cm)
                }
            },
            headers: {
                default: new Header({
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({ text: "The Store Intelligence", bold: true, size: 24, font: "Calibri" })
                            ],
                            alignment: AlignmentType.RIGHT,
                            spacing: { after: 400 } // Space after header
                        })
                    ]
                })
            },
            footers: {
                default: new Footer({
                    children: [
                        new Paragraph({
                            children: [new TextRun({ text: "Confidencial - Documento de Estimación", size: 16, color: "888888" })],
                            alignment: AlignmentType.CENTER
                        })
                    ]
                })
            },
            children: [
                // --- COVER ---
                new Paragraph({ text: "", spacing: { after: 2000 } }), // Top spacer
                new Paragraph({
                    children: [new TextRun({ text: "PROPUESTA TÉCNICA", bold: true, size: 56, font: "Calibri", color: HEX_CHARCOAL })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 }
                }),
                new Paragraph({
                    children: [new TextRun({ text: "ESTIMACIÓN DE INVERSIÓN & ALCANCE", bold: true, size: 32, font: "Calibri", color: HEX_GOLD })],
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 800 }
                }),

                // Info Table (Invisible Borders)
                new Table({
                    width: { size: 80, type: WidthType.PERCENTAGE },
                    alignment: AlignmentType.CENTER,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Cliente:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: data.clientName, bold: true })] })] })
                            ]
                        }),
                        new TableRow({
                            children: [
                                new TableCell({ children: [new Paragraph({ text: "Fecha:", alignment: AlignmentType.RIGHT })] }),
                                new TableCell({ children: [new Paragraph({ children: [new TextRun({ text: new Date().toLocaleDateString(), bold: true })] })] })
                            ]
                        })
                    ]
                }),

                new Paragraph({ text: "", pageBreakBefore: true }),

                // --- EXECUTIVE SUMMARY ---
                new Paragraph({
                    children: [new TextRun({ text: "1. RESUMEN EJECUTIVO", bold: true, size: 32, color: HEX_GOLD })],
                    spacing: { after: 300 }
                }),
                new Paragraph({
                    children: [new TextRun({
                        text: data.description || "Propuesta de servicios profesionales y tecnológicos para la optimización de procesos de negocio.",
                        size: 24
                    })],
                    alignment: AlignmentType.JUSTIFIED,
                    spacing: { after: 400 }
                }),

                // --- BUDGET ---
                new Paragraph({
                    children: [new TextRun({ text: "2. DETALLE DE INVERSIÓN", bold: true, size: 32, color: HEX_GOLD })],
                    spacing: { before: 400, after: 300 }
                }),

                // Budget Table
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    rows: [
                        // Header
                        new TableRow({
                            children: ["CONCEPTO", "DETALLE", "DURACIÓN", "SUBTOTAL"].map(t => new TableCell({
                                children: [new Paragraph({ children: [new TextRun({ text: t, bold: true, color: "FFFFFF" })] })],
                                shading: { fill: HEX_CHARCOAL, type: ShadingType.CLEAR, color: "auto" }
                            }))
                        }),
                        // Rows (Function to generate)
                        ...generateWordCostRows(data)
                    ]
                }),

                // --- TOTALS ---
                new Paragraph({ text: "", spacing: { after: 400 } }),
                new Paragraph({
                    children: [
                        new TextRun({ text: "INVERSIÓN TOTAL (" + data.durationValue + " " + data.durationUnit.toUpperCase() + "): ", bold: true, size: 28 }),
                        new TextRun({
                            text: "$" + (data.finalTotal * data.durationMonths).toLocaleString('en-US', { minimumFractionDigits: 2 }),
                            bold: true,
                            size: 32,
                            color: HEX_GOLD
                        })
                    ],
                    alignment: AlignmentType.RIGHT
                })
            ]
        }]
    })

    Packer.toBlob(doc).then(blob => {
        saveAs(blob, `cotizacion_${(data.clientName || 'proyecto').replace(/\s+/g, '_')}.docx`)
    })
}

function generateWordCostRows(data: any): TableRow[] {
    const rows: TableRow[] = []

    // Profiles
    if (data.serviceType === 'Staffing' || data.serviceType === 'Sustain') {
        data.staffingDetails.profiles.forEach((p: any) => {
            const rate = RATES[Object.keys(RATES).find(k => p.role.toLowerCase().includes(k.replace('_', ' '))) || 'react_dev'] || 4000
            const alloc = (p.allocationPercentage || 100) / 100
            const sub = rate * alloc * p.count

            rows.push(new TableRow({
                children: [
                    new TableCell({ children: [new Paragraph(p.role)] }),
                    new TableCell({ children: [new Paragraph(`${p.seniority} (${p.allocationPercentage || 100}%)`)] }),
                    new TableCell({ children: [new Paragraph(`${p.count} Rec.`)] }),
                    new TableCell({ children: [new Paragraph(`$${sub.toLocaleString()}`)] }),
                ]
            }))
        })
    } else {
        Object.entries(data.roles).forEach(([role, count]: [string, any]) => {
            if (count > 0) {
                const rate = RATES[role] || 0
                rows.push(new TableRow({
                    children: [
                        new TableCell({ children: [new Paragraph(role.replace(/_/g, ' ').toUpperCase())] }),
                        new TableCell({ children: [new Paragraph("Ssr Standard")] }),
                        new TableCell({ children: [new Paragraph(`${count} Rec.`)] }),
                        new TableCell({ children: [new Paragraph(`$${(rate * count).toLocaleString()}`)] }),
                    ]
                }))
            }
        })
    }

    return rows
}
