import { Header } from '@/components/layout/Header'
import { BottomNav } from '@/components/layout/BottomNav'
import { OnboardingGate } from '@/components/common/OnboardingGate'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-xl flex-col overflow-x-clip">
      <Header />
      <div className="relative flex min-w-0 flex-1">
        <main className="min-w-0 flex-1 p-4 pb-[calc(env(safe-area-inset-bottom)+5.25rem)] md:p-5 md:pb-[calc(env(safe-area-inset-bottom)+5.25rem)]">
          {children}
        </main>
        <BottomNav />
      </div>
      <OnboardingGate />
    </div>
  )
}
