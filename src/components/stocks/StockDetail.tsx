'use client'

import type { StockDetail as StockDetailType } from '@/types'
import { Badge } from '@/components/ui/badge'
import { PriceChange } from '@/components/common/PriceChange'
import {
  formatCurrency,
  formatCompactNumber,
  formatPercentage
} from '@/lib/utils'
import { Spinner } from '../ui/spinner'

interface StockDetailProps {
  stock: StockDetailType
  isRefetching: boolean
}

function MetricTile({
  id,
  label,
  value,
  hint
}: {
  id: string
  label: string
  value: string | null
  hint?: string
}) {
  return (
    <div
      data-testid={`metric-tile-${id}`}
      className="border-border/70 bg-card/60 flex min-h-16 flex-col justify-between rounded-lg border p-3"
    >
      <p className="text-muted-foreground text-[11px] leading-tight">{label}</p>
      <p className="mt-1 font-mono text-sm font-semibold tracking-tight tabular-nums">
        {value ?? '-'}
      </p>
      {hint && (
        <p className="text-muted-foreground mt-0.5 font-mono text-[10px] tabular-nums">
          {hint}
        </p>
      )}
    </div>
  )
}

export function StockDetailHeader({ stock, isRefetching }: StockDetailProps) {
  return (
    <section className="flex min-w-0 items-start justify-between gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h1 className="font-mono text-2xl font-bold tracking-tight tabular-nums">
            {stock.code.replace('.JK', '')}
          </h1>
          {isRefetching && <Spinner />}
        </div>
        <p className="text-muted-foreground truncate text-xs">{stock.name}</p>
        <Badge
          variant="secondary"
          className="text-primary mt-1.5 max-w-full truncate px-2 py-0 text-[10px]"
        >
          {stock.sector}
        </Badge>
      </div>

      <div className="shrink-0 text-right">
        <p className="font-mono text-2xl font-bold tracking-tight tabular-nums">
          {formatCurrency(stock.price)}
        </p>
        <PriceChange
          value={stock.change}
          percentage={stock.changePercent}
          showIcon={false}
          className="mt-1 justify-end font-mono text-xs tabular-nums"
        />
      </div>
    </section>
  )
}

export function StockMetrics({ stock }: Pick<StockDetailProps, 'stock'>) {
  return (
    <section className="space-y-2.5">
      <h2 className="text-base font-semibold tracking-tight">Key metrics</h2>
      <div className="grid grid-cols-2 gap-2">
        <MetricTile
          id="market-cap"
          label="Market cap"
          value={formatCompactNumber(stock.marketCap)}
        />
        <MetricTile
          id="valuation"
          label="Valuation"
          value={stock.peRatio?.toFixed(2) ?? null}
          hint={`P/B ${stock.pbRatio?.toFixed(2) ?? '-'}`}
        />
        <MetricTile
          id="roe"
          label="ROE"
          value={stock.roe != null ? formatPercentage(stock.roe) : null}
        />
        <MetricTile
          id="dividend-yield"
          label="Dividend yield"
          value={
            stock.dividendYield != null
              ? formatPercentage(stock.dividendYield)
              : null
          }
        />
        <MetricTile
          id="eps"
          label="EPS"
          value={stock.eps != null ? formatCurrency(stock.eps) : null}
        />
        <MetricTile
          id="week-52"
          label="52W range"
          value={`${formatCurrency(stock.fiftyTwoWeekLow)} - ${formatCurrency(
            stock.fiftyTwoWeekHigh
          )}`}
        />
        <MetricTile
          id="volume"
          label="Volume"
          value={formatCompactNumber(stock.volume)}
        />
        <MetricTile id="open" label="Open" value={formatCurrency(stock.open)} />
        <MetricTile
          id="day-range"
          label="Day range"
          value={`${formatCurrency(stock.low)} - ${formatCurrency(stock.high)}`}
        />
        <MetricTile
          id="prev-close"
          label="Prev close"
          value={formatCurrency(stock.previousClose)}
        />
      </div>
    </section>
  )
}
