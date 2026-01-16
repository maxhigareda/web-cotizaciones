import QuoteBuilder from '@/components/quote-builder'
import { getServiceRates } from '@/lib/actions'

export default async function QuotePage() {
    const rates = await getServiceRates()
    return <QuoteBuilder dbRates={rates} />
}
