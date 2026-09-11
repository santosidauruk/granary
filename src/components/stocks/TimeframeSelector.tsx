'use client'

import { TIMEFRAMES } from '@/lib/constants'
import { useStockStore } from '@/stores/useStockStore'
import type { Timeframe } from '@/types'

export function TimeframeSelector() {
  const { selectedTimeframe, setSelectedTimeframe } = useStockStore()

  return (
    <div
      role="group"
      aria-label="Chart timeframe"
      className="grid grid-cols-7 gap-1"
    >
      {TIMEFRAMES.map((tf) => (
        <button
          key={tf.value}
          type="button"
          aria-pressed={selectedTimeframe === tf.value}
          onClick={() => setSelectedTimeframe(tf.value as Timeframe)}
          className={`min-w-0 rounded-md px-1 py-1.5 text-[10px] font-medium transition-colors active:scale-[0.98] sm:text-xs ${
            selectedTimeframe === tf.value
              ? 'bg-primary text-primary-foreground'
              : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
          }`}
        >
          {tf.label}
        </button>
      ))}
    </div>
  )
}
