import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { Package, ShoppingCart, Users, DollarSign } from 'lucide-react'

export default function Dashboard() {
    const [stats, setStats] = useState({
        products: 0,
        orders: 0,
        users: 0,
        revenue: 0
    })

    useEffect(() => {
        async function fetchStats() {
            const [products, orders, users] = await Promise.all([
                supabase.from('products').select('*', { count: 'exact', head: true }),
                supabase.from('orders').select('total_amount'),
                supabase.from('users').select('*', { count: 'exact', head: true })
            ])

            const totalRevenue = orders.data?.reduce((sum, order) => sum + (order.total_amount || 0), 0) || 0

            setStats({
                products: products.count || 0,
                orders: orders.data?.length || 0,
                users: users.count || 0,
                revenue: totalRevenue
            })
        }
        fetchStats()
    }, [])

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard Overview</h1>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Revenue</h3>
                            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">${stats.revenue.toFixed(2)}</p>
                        </div>
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                            <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Orders</h3>
                            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{stats.orders}</p>
                        </div>
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                            <ShoppingCart className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Products</h3>
                            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{stats.products}</p>
                        </div>
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                            <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Users</h3>
                            <p className="text-2xl font-bold mt-2 text-gray-900 dark:text-white">{stats.users}</p>
                        </div>
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-full">
                            <Users className="h-6 w-6 text-orange-600 dark:text-orange-400" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
