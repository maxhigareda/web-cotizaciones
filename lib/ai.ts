'use server'

export async function polishTextAction(rawText: string): Promise<string> {
    // Simulate API Latency
    await new Promise(resolve => setTimeout(resolve, 1500))

    if (!rawText || rawText.length < 5) return rawText

    // Mock AI Logic: Add professional prefixes/suffixes and expansions
    const prefixes = [
        "Implementación de una arquitectura de datos escalable orientada a",
        "Despliegue de un ecosistema analítico moderno para optimizar",
        "Solución integral de gobernanza y procesamiento de datos para",
    ]

    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)]

    return `${randomPrefix} ${rawText.toLowerCase()}. 
    
El alcance incluye la ingesta automatizada desde múltiples fuentes, procesamiento distribuido mediante Silver/Gold layers en Databricks, y visualización ejecutiva en PowerBI, asegurando cumplimiento normativo y alta disponibilidad.`
}

export async function generateMermaidUpdate(currentCode: string, prompt: string): Promise<string> {
    // Simulate API Latency (shorter for better feel)
    await new Promise(resolve => setTimeout(resolve, 1000))

    let newCode = currentCode
    const p = prompt.toLowerCase()

    // --- NLP Regex Helper ---
    const findTrigger = (words: string[]) => words.some(w => p.includes(w))
    const extractTarget = (trigger: string) => {
        const regex = new RegExp(`${trigger}\\s+([a-zA-Z0-9_\\s]+)`, 'i')
        const match = p.match(regex)
        return match ? match[1].trim() : null
    }

    // 1. ADDITION / INSERTION
    // Pattern: "Agrega [Tableau] a [Sales]" or "Agrega [Validación]"
    if (findTrigger(['agrega', 'añadir', 'sumar', 'add', 'inserta'])) {
        const targetRaw = extractTarget('agrega') || extractTarget('añadir') || extractTarget('sumar') || extractTarget('add')

        if (targetRaw) {
            // Clean target name
            const nodeName = targetRaw.split(' ')[0].replace(/[^a-zA-Z0-9]/g, '')
            const nodeLabel = targetRaw.split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')

            // Heuristic to find where to connect: "a [Place]" or "después de [Place]"
            let connectTo = null
            if (p.includes(' a ') || p.includes(' after ') || p.includes(' despues de ')) {
                // Try to find an existing node in the code to attach to
                const existingNodes = [...currentCode.matchAll(/([A-Z][a-zA-Z0-9]*)\s*\[/g)].map(m => m[1])
                connectTo = existingNodes.find(n => p.includes(n.toLowerCase())) || existingNodes[existingNodes.length - 1] // Fallback to last node
            }

            if (connectTo) {
                newCode += `\n    ${connectTo} --> ${nodeName}[${nodeLabel}]`
            } else {
                // Just add it loosely or to the last defined structure if possible, otherwise just a floating node (user can fix)
                // Better: Find the last node involved in a relationship
                const matches = [...newCode.matchAll(/(\w+)\s*-->/g)]
                const lastNode = matches.length > 0 ? matches[matches.length - 1][1] : 'Start'
                newCode += `\n    ${lastNode} --> ${nodeName}[${nodeLabel}]`
            }

            // Style it nicely automatically
            newCode += `\n    style ${nodeName} fill:#F5CB5C,color:#171717,stroke:#333`

            return newCode
        }
    }

    // 2. STYLING/COLOR
    if (findTrigger(['color', 'pintar', 'rojo', 'verde', 'azul', 'amarillo'])) {
        const colorMap: any = {
            'rojo': '#EF4444',
            'red': '#EF4444',
            'verde': '#10B981',
            'green': '#10B981',
            'azul': '#3B82F6',
            'blue': '#3B82F6',
            'amarillo': '#F59E0B',
            'yellow': '#F59E0B'
        }

        const colorKey = Object.keys(colorMap).find(c => p.includes(c))
        if (colorKey) {
            const existingNodes = [...currentCode.matchAll(/([A-Z][a-zA-Z0-9]*)\s*\[/g)].map(m => m[1])
            // Find which node to paint
            const targetNode = existingNodes.find(n => p.includes(n.toLowerCase())) || existingNodes[0] // Fallback first

            if (targetNode) {
                newCode += `\n    style ${targetNode} fill:${colorMap[colorKey]},stroke:${colorMap[colorKey]},color:#fff`
                return newCode
            }
        }
    }

    // 3. REMOVAL
    if (findTrigger(['eliminar', 'quitar', 'borrar', 'remove', 'delete'])) {
        const targetRaw = extractTarget('eliminar') || extractTarget('remove')
        if (targetRaw) {
            const nodeName = targetRaw.split(' ')[0]
            // Simple comment out strategy
            // Regex to match lines with this node
            const lines = newCode.split('\n')
            newCode = lines.map(line => {
                if (line.toLowerCase().includes(nodeName.toLowerCase())) {
                    return `%% ${line} (Eliminado por IA)`
                }
                return line
            }).join('\n')
            return newCode
        }
    }

    // --- LEGACY/SPECIFIC HANDLERS (Keep correctly working ones) ---

    // Heuristic Logic for Demo
    if (p.includes("validación") || p.includes("validation")) {
        if (!newCode.includes("Validation")) {
            newCode = newCode.replace(/Source\s*-->\s*Pipe/i, "Source --> Validation\n    Validation[Validación de Calidad] --> Pipe")
            newCode += "\n    style Validation fill:#f9f,stroke:#333,stroke-width:2px"
            return newCode
        }
    }

    if (p.includes("error") || p.includes("fallo")) {
        if (!newCode.includes("ErrorLog")) {
            newCode += "\n    Pipe -.->|Error| ErrorLog[Log de Errores]"
            newCode += "\n    style ErrorLog fill:#ffaaaa,stroke:#d00"
            return newCode // Return early to avoid "fallback note"
        }
    }

    if (p.includes("kafka") || p.includes("streaming")) {
        newCode = newCode.replace(/Source\s*-->\s*Pipe/i, "Source --> Kafka[Kafka Stream]\n    Kafka --> Pipe")
        return newCode
    }

    // 4. FALLBACK: SMART NOTE
    // If we reached here, we couldn't parse a specific action, but we don't want to break the diagram or just add a dumb note if possible.
    // Let's try to interpret "Tableau" as an addition request even without "Agrega" keyword if it's a known tool
    const knownTools = ['tableau', 'powerbi', 'looker', 'excel', 'snowflake', 'databricks', 'sap']
    const mentionedTool = knownTools.find(t => p.includes(t))

    if (mentionedTool && newCode === currentCode) {
        // Auto-add mentioned tool to the end
        const toolName = mentionedTool.charAt(0).toUpperCase() + mentionedTool.slice(1)
        const matches = [...newCode.matchAll(/(\w+)\s*-->/g)]
        const lastNode = matches.length > 0 ? matches[matches.length - 1][1] : 'Start'
        newCode += `\n    ${lastNode} --> ${toolName}[${toolName}]`
        newCode += `\n    style ${toolName} fill:#F5CB5C,color:#171717`
        return newCode
    }

    // Genuine failure to parse
    if (newCode === currentCode) {
        newCode += `\n    Note[Ops: No entendí "${prompt}". Intenta 'Agrega [Nodo]' o 'Color [Nodo] [Color]']`
    }

    return newCode
}
