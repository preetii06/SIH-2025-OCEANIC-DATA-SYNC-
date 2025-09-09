import { Outlet } from 'react-router-dom'
import TopNav from './TopNav'
import Footer from './Footer'
export default function SidebarLayout() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-200">
      <main>
        <TopNav />
        <div className="p-6">
          <Outlet />
        </div>
        <Footer />
      </main>
    </div>
  )
}


