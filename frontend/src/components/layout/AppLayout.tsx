import { Outlet } from 'react-router-dom'
import AppNav from './AppNav'
import { ErrorBoundary } from '@/components/common'

const AppLayout: React.FC = () => {
  return (
    <>
      <AppNav />
      <main className="app-main">
        <ErrorBoundary>
          <Outlet />
        </ErrorBoundary>
      </main>
    </>
  )
}

export default AppLayout
