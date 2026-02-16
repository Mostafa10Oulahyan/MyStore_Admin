import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            <div className="w-full max-w-md flex flex-col items-center">
                <h1 className="text-2xl font-bold mb-8 text-gray-900 dark:text-white">Store Admin</h1>
                <Outlet />
            </div>
        </div>
    )
}
