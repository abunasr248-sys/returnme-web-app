import { lazy, Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from './components/ui'
import { SessionProvider } from './lib/session'
import FinderPage from './pages/finder/FinderPage'
import CodeEntry from './pages/finder/CodeEntry'

// The finder page ships in the main bundle so it loads fast on a phone;
// everything owner-facing is split out and loaded on demand.
const Landing = lazy(() => import('./pages/Landing'))
const Auth = lazy(() => import('./pages/Auth'))
const OwnerLayout = lazy(() => import('./pages/app/OwnerLayout'))
const Items = lazy(() => import('./pages/app/Items'))
const ItemForm = lazy(() => import('./pages/app/ItemForm'))
const ItemDetail = lazy(() => import('./pages/app/ItemDetail'))
const Alerts = lazy(() => import('./pages/app/Alerts'))
const Settings = lazy(() => import('./pages/app/Settings'))

export default function App() {
  return (
    <SessionProvider>
      <Toaster />
      <Suspense fallback={<div className="min-h-dvh bg-paper" />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/signup" element={<Auth mode="signup" />} />
          <Route path="/f" element={<CodeEntry />} />
          <Route path="/f/:token" element={<FinderPage />} />
          <Route path="/app" element={<OwnerLayout />}>
            <Route index element={<Navigate to="items" replace />} />
            <Route path="items" element={<Items />} />
            <Route path="items/new" element={<ItemForm />} />
            <Route path="items/:id" element={<ItemDetail />} />
            <Route path="items/:id/edit" element={<ItemForm />} />
            <Route path="alerts" element={<Alerts />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </SessionProvider>
  )
}
