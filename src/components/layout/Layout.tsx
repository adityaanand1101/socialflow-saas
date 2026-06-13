import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { Topbar } from './Topbar'
import { useStore } from '../../store/useStore'
import { useAuth } from '@clerk/react'

export const Layout = () => {
  const fetchData = useStore((state) => state.fetchData)
  const { isLoaded, isSignedIn, getToken } = useAuth()

  useEffect(() => {
    const fetchWithToken = async () => {
      if (isLoaded && isSignedIn) {
        const token = await getToken()
        if (token) {
          fetchData(token)
        }
      }
    }
    fetchWithToken()
  }, [isLoaded, isSignedIn, getToken, fetchData])

  return (
    <div className="flex h-screen bg-[#0F1117] overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col relative overflow-hidden">
        <Topbar />
        <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <Outlet />
        </main>
      </div>
    </div>
  )
}

