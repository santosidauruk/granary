import { afterEach, beforeEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useStockMeta } from '@/stores/useStockMeta'
import { useWatchlist } from '@/stores/useWatchlist'
import { StockDetailPageClient } from './StockDetailPageClient'

vi.mock('@/components/charts/CandlestickChart', () => ({
  CandlestickChart: ({ data }: { data: unknown[] }) => (
    <div data-testid="candlestick-chart">{data.length} bars</div>
  )
}))

function renderPage(code: string) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } }
  })
  return render(
    <QueryClientProvider client={client}>
      <StockDetailPageClient code={code} />
    </QueryClientProvider>
  )
}

const fetchMock = vi.fn()

const stockJson = (overrides: Record<string, unknown> = {}) => ({
  code: 'BBCA.JK',
  name: 'BBCA.JK',
  sector: 'Unknown',
  price: 9000,
  previousClose: 8950,
  change: 50,
  changePercent: 0.5,
  volume: 1_000_000,
  marketCap: 0,
  high: 9100,
  low: 8900,
  open: 8950,
  currency: 'IDR',
  exchange: 'JKT',
  peRatio: null,
  pbRatio: null,
  dividendYield: null,
  roe: null,
  eps: null,
  fiftyTwoWeekHigh: 9500,
  fiftyTwoWeekLow: 7500,
  description: '',
  ...overrides
})

const historyJson = [
  {
    time: 1_725_235_200,
    open: 8950,
    high: 9100,
    low: 8900,
    close: 9000,
    volume: 1_000_000
  }
]

function mockCachedStock({
  stockOverrides = {},
  history = historyJson
}: {
  stockOverrides?: Record<string, unknown>
  history?: unknown[]
} = {}) {
  useStockMeta.setState({
    meta: {
      BBCA: { name: 'Bank Central Asia Tbk', sector: 'Financial Services' }
    }
  })

  fetchMock.mockImplementation((url: string) => {
    if (url.startsWith('/api/stocks/BBCA.JK/history')) {
      return Promise.resolve(
        new Response(JSON.stringify(history), { status: 200 })
      )
    }
    if (url.startsWith('/api/stocks/BBCA')) {
      return Promise.resolve(
        new Response(JSON.stringify(stockJson(stockOverrides)), { status: 200 })
      )
    }
    return Promise.resolve(new Response('{}', { status: 200 }))
  })
}

beforeEach(() => {
  localStorage.clear()
  useStockMeta.setState({ meta: {} })
  useWatchlist.setState({ items: [] })
  fetchMock.mockReset()
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('StockDetailPageClient', () => {
  it('renders the chart before the stock metrics', async () => {
    mockCachedStock()

    renderPage('BBCA')

    const chart = await screen.findByTestId('candlestick-chart')
    const firstMetric = screen.getByTestId('metric-tile-open')

    expect(
      chart.compareDocumentPosition(firstMetric) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('renders the timeframe selector after the chart', async () => {
    mockCachedStock()

    renderPage('BBCA')

    const chart = await screen.findByTestId('candlestick-chart')
    const selectedTimeframe = screen.getByRole('button', { name: '1D' })

    expect(
      chart.compareDocumentPosition(selectedTimeframe) &
        Node.DOCUMENT_POSITION_FOLLOWING
    ).toBeTruthy()
  })

  it('renders cached meta name+sector and does not fetch profile', async () => {
    useStockMeta.setState({
      meta: {
        BBCA: { name: 'Bank Central Asia Tbk', sector: 'Financial Services' }
      }
    })

    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith('/api/stocks/BBCA/profile')) {
        throw new Error('profile must not be fetched when cached')
      }
      if (url.startsWith('/api/stocks/BBCA/history')) {
        return Promise.resolve(new Response('[]', { status: 200 }))
      }
      if (url.startsWith('/api/stocks/BBCA')) {
        return Promise.resolve(
          new Response(JSON.stringify(stockJson()), { status: 200 })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderPage('BBCA')

    expect(await screen.findByText('Bank Central Asia Tbk')).toBeInTheDocument()
    expect(screen.getByText('Financial Services')).toBeInTheDocument()

    const calls = fetchMock.mock.calls.map((c) => c[0] as string)
    expect(calls.some((u) => u.includes('/profile'))).toBe(false)
  })

  it('fetches profile on cache miss and persists to stockMeta', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith('/api/stocks/BBCA/profile')) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              code: 'BBCA',
              name: 'Bank Central Asia Tbk',
              sector: 'Financial Services'
            }),
            { status: 200 }
          )
        )
      }
      if (url.startsWith('/api/stocks/BBCA/history')) {
        return Promise.resolve(new Response('[]', { status: 200 }))
      }
      if (url.startsWith('/api/stocks/BBCA')) {
        return Promise.resolve(
          new Response(JSON.stringify(stockJson()), { status: 200 })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderPage('BBCA')

    await waitFor(() => {
      expect(useStockMeta.getState().meta.BBCA).toEqual({
        name: 'Bank Central Asia Tbk',
        sector: 'Financial Services'
      })
    })

    expect(await screen.findByText('Bank Central Asia Tbk')).toBeInTheDocument()
    expect(screen.getByText('Financial Services')).toBeInTheDocument()
  })

  it('falls back to "Unknown" sector when profile fetch fails', async () => {
    fetchMock.mockImplementation((url: string) => {
      if (url.startsWith('/api/stocks/BBCA/profile')) {
        return Promise.resolve(new Response('boom', { status: 500 }))
      }
      if (url.startsWith('/api/stocks/BBCA/history')) {
        return Promise.resolve(new Response('[]', { status: 200 }))
      }
      if (url.startsWith('/api/stocks/BBCA')) {
        return Promise.resolve(
          new Response(JSON.stringify(stockJson()), { status: 200 })
        )
      }
      return Promise.resolve(new Response('{}', { status: 200 }))
    })

    renderPage('BBCA')

    await waitFor(() => {
      expect(useStockMeta.getState().meta.BBCA?.sector).toBe('Unknown')
    })

    expect(await screen.findByText('Unknown')).toBeInTheDocument()
  })

  it('groups stock metrics into compact metric tiles', async () => {
    mockCachedStock({
      stockOverrides: {
        open: 8950,
        high: 9100,
        low: 8900,
        marketCap: 1_000_000_000
      },
      history: []
    })

    renderPage('BBCA')

    expect(await screen.findByTestId('metric-tile-open')).toHaveTextContent(
      'Open'
    )
    expect(screen.getByTestId('metric-tile-day-range')).toHaveTextContent(
      'Day range'
    )
    expect(screen.getByTestId('metric-tile-market-cap')).toHaveTextContent(
      'Market cap'
    )
  })

  it('shows ROE when it is available in the stock detail', async () => {
    mockCachedStock({
      stockOverrides: { roe: 18.31 },
      history: []
    })

    renderPage('BBCA')

    expect(await screen.findByTestId('metric-tile-roe')).toHaveTextContent(
      'ROE'
    )
    expect(screen.getByTestId('metric-tile-roe')).toHaveTextContent('+18.31%')
  })
})
