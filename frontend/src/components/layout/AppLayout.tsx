import { useCallback, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { Outlet } from 'react-router-dom'
import AppNav from './AppNav'
import { ErrorBoundary } from '@/components/common'

const AppLayout: React.FC = () => {
  const location = useLocation()
  const pathRef = useRef(location.pathname)
  const shouldResetError = useCallback(() => {
    if (location.pathname !== pathRef.current) {
      pathRef.current = location.pathname
      return true
    }
    return false
  }, [location.pathname])

  return (
    <>
      <AppNav />
      <main className="app-main">
        <ErrorBoundary reset={shouldResetError}>
          <Outlet />
        </ErrorBoundary>
      </main>
    </>
  )
}

export default AppLayout
