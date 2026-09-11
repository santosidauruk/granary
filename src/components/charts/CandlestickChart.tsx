'use client'
import { useEffect, useRef } from 'react'
import {
  createChart,
  IChartApi,
  ISeriesApi,
  ColorType,
  CandlestickSeries,
  DeepPartial,
  ChartOptions
} from 'lightweight-charts'
import type { OHLCV } from '@/types'
import { useTheme } from 'next-themes'

interface Props {
  data: OHLCV[]
}

const LIGHT_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: {
      type: ColorType.Solid,
      color: '#fbfbfc'
    },
    textColor: '#191919'
  },
  grid: {
    vertLines: { color: '#e5e7eb' },
    horzLines: { color: '#e5e7eb' }
  }
}

const DARK_CHART_OPTIONS: DeepPartial<ChartOptions> = {
  layout: {
    background: {
      type: ColorType.Solid,
      color: '#1a1b1e'
    },
    textColor: '#fafafa'
  },
  grid: {
    vertLines: { color: '#2c2e33' },
    horzLines: { color: '#2c2e33' }
  }
}

const chartLayoutOptions = (theme: string): DeepPartial<ChartOptions> => {
  return theme === 'light' ? LIGHT_CHART_OPTIONS : DARK_CHART_OPTIONS
}

export const CandlestickChart = ({ data }: Props) => {
  const { resolvedTheme } = useTheme()
  const initialTheme = useRef(resolvedTheme)
  const containerRef = useRef<HTMLDivElement>(null)
  const chartRef = useRef<IChartApi | null>(null)
  const seriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const chart = createChart(containerRef.current, {
      ...chartLayoutOptions(initialTheme.current as string),
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight
    })
    chart.timeScale().fitContent()
    const series = chart.addSeries(CandlestickSeries)
    chartRef.current = chart
    seriesRef.current = series

    const observer = new ResizeObserver(([entry]) => {
      chart.applyOptions({
        width: entry.contentRect.width,
        height: entry.contentRect.height
      })
    })
    observer.observe(containerRef.current)

    return () => {
      observer.disconnect()
      chart.remove()
    }
  }, [])

  useEffect(() => {
    if (!seriesRef.current || !data.length) return

    // Yahoo Finance returns the full dataset each time, so we set fullset data foreach changes
    seriesRef.current.setData(data)

    chartRef.current?.timeScale().fitContent()
  }, [data])

  useEffect(() => {
    if (!chartRef.current) return
    chartRef.current.applyOptions({
      ...chartLayoutOptions(resolvedTheme as string)
    })
  }, [resolvedTheme])

  return <div ref={containerRef} className="h-64 w-full sm:h-72" />
}
