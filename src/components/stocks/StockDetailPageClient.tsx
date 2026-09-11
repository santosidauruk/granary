'use client'

import { useEffect } from 'react'
import { useStockHistory } from '@/hooks/useStocks'
import { useRealtimeStockDetail } from '@/hooks/useRealtimeStock'
import { useStockStore } from '@/stores/useStockStore'
import { useStockMeta } from '@/stores/useStockMeta'
import { TIMEFRAMES } from '@/lib/constants'
import { fetchStockProfile } from '@/lib/stock-meta'
import {
  StockDetailHeader,
  StockMetrics
} from '@/components/stocks/StockDetail'
import { TimeframeSelector } from '@/components/stocks/TimeframeSelector'
import { WatchlistButton } from '@/components/stocks/WatchlistButton'
import { CandlestickChart } from '@/components/charts/CandlestickChart'
import { Skeleton } from '@/components/ui/skeleton'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

const bareCode = (code: string) => code.replace(/\.JK$/i, '').toUpperCase()

interface Props {
  code: string
}

export function StockDetailPageClient({ code }: Props) {
  const bare = bareCode(code)
  const symbol = `${bare}.JK`

  const { selectedTimeframe } = useStockStore()
  const timeframeConfig = TIMEFRAMES.find(
    (tf) => tf.value === selectedTimeframe
  )

  const cachedMeta = useStockMeta((s) => s.meta[bare])
  const setMeta = useStockMeta((s) => s.setMeta)

  useEffect(() => {
    if (cachedMeta) return
    fetchStockProfile(bare)
      .then((m) => setMeta(bare, m))
      .catch(() => setMeta(bare, { name: bare, sector: 'Unknown' }))
  }, [bare, cachedMeta, setMeta])

  const {
    data: stock,
    isLoading: stockLoading,
    isRefetching: stockIsRefetching
  } = useRealtimeStockDetail(symbol, { refetchInterval: 5_000 })

  const { data: history, isLoading: historyLoading } = useStockHistory(
    symbol,
    timeframeConfig?.interval ?? '1d',
    timeframeConfig?.range ?? '6mo'
  )

  const displayed = stock
    ? {
        ...stock,
        name: cachedMeta?.name ?? stock.name,
        sector: cachedMeta?.sector ?? 'Unknown'
      }
    : undefined

  return (
    <div className="space-y-5">
      <div className="flex min-h-8 items-center justify-between">
        <Link
          href="/portfolio"
          className="text-primary hover:text-primary/80 inline-flex min-h-8 items-center gap-1 text-xs font-medium transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <WatchlistButton stockCode={symbol} />
      </div>

      {stockLoading ? (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-4 w-40" />
          </div>
          <Skeleton className="h-12 w-32" />
        </div>
      ) : displayed ? (
        <StockDetailHeader stock={displayed} isRefetching={stockIsRefetching} />
      ) : (
        <div className="text-muted-foreground py-8 text-center">
          Stock not found.
        </div>
      )}

      <section
        aria-label="Price chart"
        className="border-border/80 bg-card/45 overflow-hidden rounded-lg border"
      >
        {historyLoading ? (
          <Skeleton className="h-64 w-full rounded-none sm:h-72" />
        ) : history && history.length > 0 ? (
          <CandlestickChart data={history} />
        ) : (
          <div className="text-muted-foreground flex h-64 items-center justify-center px-4 text-center text-xs sm:h-72">
            No chart data available.
          </div>
        )}

        <div className="border-t p-1.5">
          <TimeframeSelector />
        </div>
      </section>

      {displayed && <StockMetrics stock={displayed} />}
    </div>
  )
}
