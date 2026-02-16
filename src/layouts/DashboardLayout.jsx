import { Outlet, NavLink, Navigate, useLocation } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/clerk-react'
import { LayoutDashboard, Package, ShoppingCart, Users, FolderTree, Menu, X, ShieldAlert } from 'lucide-react'
import { useState } from 'react'
import { cn } from '../lib/utils'

export default function DashboardLayout() {
    const { user, isLoaded, isSignedIn } = useUser()
    const [isSidebarOpen, setIsSidebarOpen] = useState(false)
    const location = useLocation()

    if (!isLoaded) return <div className="flex items-center justify-center h-screen">Loading...</div>

    // Redirect to sign-in if not authenticated
    if (!isSignedIn) return <Navigate to="/sign-in" replace />

    // Strict Admin Check
    if (user?.publicMetadata?.role !== 'admin') {
        return (
            <div className="flex flex-col items-center justify-center h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 p-4">
                <ShieldAlert className="h-16 w-16 text-red-600 mb-4" />
                <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
                <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">
                    You do not have permission to view this dashboard. This area is restricted to administrators only.
                </p>
                <div className="flex gap-4">
                    <UserButton />
                    <span className="self-center text-sm font-medium">Sign in with an admin account</span>
                </div>
            </div>
        )
    }

    const routes = [
        { href: '/', label: 'Overview', icon: LayoutDashboard },
        { href: '/products', label: 'Products', icon: Package },
        { href: '/orders', label: 'Orders', icon: ShoppingCart },
        { href: '/categories', label: 'Categories', icon: FolderTree },
        { href: '/users', label: 'Users', icon: Users },
    ]

    return (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100">
            {/* Mobile Sidebar Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={cn(
                "fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
                isSidebarOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
                    <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent"><img src="newLogo.png"  alt="Logo" /></h1>
                    <button onClick={() => setIsSidebarOpen(false)} className="md:hidden">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <nav className="p-4 space-y-1">
                    {routes.map((route) => (
                        <NavLink
                            key={route.href}
                            to={route.href}
                            className={({ isActive }) => cn(
                                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                                isActive
                                    ? "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400"
                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            )}
                            onClick={() => setIsSidebarOpen(false)}
                        >
                            <route.icon className="h-5 w-5" />
                            {route.label}
                        </NavLink>
                    ))}
                </nav>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center gap-3">
                        <UserButton />
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">Profile</span>
                            <span className="text-xs text-gray-500">Manage account</span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 md:hidden">
                    <button onClick={() => setIsSidebarOpen(true)}>
                        <Menu className="h-6 w-6" />
                    </button>
                    <h1 className="text-lg font-semibold capitalize">{routes.find(r => r.href === location.pathname)?.label || 'Overview'}</h1>
                    <div className="w-6" /> {/* Spacer */}
                </header>
                <main className="flex-1 overflow-auto p-4 md:p-8">
                    <Outlet />
                </main>
            </div>
        </div>
    )
}
