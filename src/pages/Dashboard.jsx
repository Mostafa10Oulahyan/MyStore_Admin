import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import {
    Package, ShoppingCart, Users as UsersIcon, DollarSign, TrendingUp, Plus,
    Eye, ArrowRight, Star, AlertTriangle, Layers, Box, Tag, Clock,
    CheckCircle, XCircle, Truck, Ban, BarChart3, Activity
} from 'lucide-react'
import { cn } from '../lib/utils'

// ─── Mini SVG Donut Chart ───
function DonutChart({ segments, size = 80, strokeWidth = 10 }) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    let offset = 0

    return (
        <svg width={size} height={size} className="-rotate-90">
            <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="currentColor" strokeWidth={strokeWidth} className="text-gray-700/20" />
            {segments.map((seg, i) => {
                const dashLen = (seg.value / 100) * circumference
                const el = (
                    <circle
                        key={i} cx={size / 2} cy={size / 2} r={radius} fill="none"
                        stroke={seg.color} strokeWidth={strokeWidth}
                        strokeDasharray={`${dashLen} ${circumference - dashLen}`}
                        strokeDashoffset={-offset}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                )
                offset += dashLen
                return el
            })}
        </svg>
    )
}

// ─── Mini Bar Chart ───
function MiniBarChart({ data, maxVal }) {
    const max = maxVal || Math.max(...data.map(d => d.value), 1)
    return (
        <div className="flex items-end gap-1 h-16">
            {data.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                        className={cn("w-full rounded-sm transition-all duration-700 ease-out min-h-[2px]", d.className || "bg-blue-500")}
                        style={{ height: `${(d.value / max) * 100}%` }}
                        title={`${d.label}: ${d.value}`}
                    />
                    <span className="text-[8px] text-gray-500 truncate w-full text-center">{d.label}</span>
                </div>
            ))}
        </div>
    )
}

export default function Dashboard() {
    const [loading, setLoading] = useState(true)
    const [data, setData] = useState({
        revenue: 0,
        ordersCount: 0,
        productsCount: 0,
        usersCount: 0,
        categoriesCount: 0,
        reviewsCount: 0,
        avgRating: 0,
        // Order statuses
        ordersByStatus: { pending: 0, confirmed: 0, delivered: 0, rejected: 0, cancelled: 0 },
        // Product statuses
        productsByStatus: { active: 0, draft: 0, archived: 0 },
        // Stock
        totalVariants: 0,
        totalStock: 0,
        outOfStock: 0,
        lowStock: 0,
        // Recent orders
        recentOrders: [],
        // Top categories
        topCategories: [],
        // Product types
        productTypes: [],
    })

    useEffect(() => {
        fetchDashboardData()
    }, [])

    async function fetchDashboardData() {
        setLoading(true)
        try {
            const [
                ordersRes,
                productsRes,
                usersRes,
                categoriesRes,
                reviewsRes,
                variantsRes,
                recentOrdersRes,
                productTypesRes,
            ] = await Promise.all([
                supabase.from('orders').select('total_amount, status'),
                supabase.from('products').select('status, category_id, categories(name)'),
                supabase.from('users').select('*', { count: 'exact', head: true }),
                supabase.from('categories').select('id, name, is_active'),
                supabase.from('reviews').select('rating'),
                supabase.from('product_variants').select('stock_quantity, is_available'),
                supabase.from('orders').select('id, order_number, customer_first_name, customer_last_name, total_amount, status, created_at').order('created_at', { ascending: false }).limit(5),
                supabase.from('product_types').select('id, name'),
            ])

            const orders = ordersRes.data || []
            const products = productsRes.data || []
            const reviews = reviewsRes.data || []
            const variants = variantsRes.data || []

            // Revenue
            const revenue = orders.reduce((s, o) => s + (parseFloat(o.total_amount) || 0), 0)

            // Order statuses
            const ordersByStatus = { pending: 0, confirmed: 0, delivered: 0, rejected: 0, cancelled: 0 }
            orders.forEach(o => { if (ordersByStatus[o.status] !== undefined) ordersByStatus[o.status]++ })

            // Product statuses
            const productsByStatus = { active: 0, draft: 0, archived: 0 }
            products.forEach(p => { if (productsByStatus[p.status] !== undefined) productsByStatus[p.status]++ })

            // Stock analysis
            const totalStock = variants.reduce((s, v) => s + (v.stock_quantity || 0), 0)
            const outOfStock = variants.filter(v => (v.stock_quantity || 0) === 0).length
            const lowStock = variants.filter(v => (v.stock_quantity || 0) > 0 && (v.stock_quantity || 0) < 10).length

            // Average rating
            const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0

            // Top categories (count products per category)
            const catMap = {}
            products.forEach(p => {
                const name = p.categories?.name || 'Uncategorized'
                catMap[name] = (catMap[name] || 0) + 1
            })
            const topCategories = Object.entries(catMap).map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count).slice(0, 6)

            setData({
                revenue,
                ordersCount: orders.length,
                productsCount: products.length,
                usersCount: usersRes.count || 0,
                categoriesCount: (categoriesRes.data || []).length,
                reviewsCount: reviews.length,
                avgRating,
                ordersByStatus,
                productsByStatus,
                totalVariants: variants.length,
                totalStock,
                outOfStock,
                lowStock,
                recentOrders: recentOrdersRes.data || [],
                topCategories,
                productTypes: productTypesRes.data || [],
            })
        } catch (err) {
            console.error('Dashboard fetch error:', err)
        }
        setLoading(false)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="flex flex-col items-center gap-3">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500" />
                    <p className="text-sm text-gray-500">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    const totalOrders = data.ordersCount || 1
    const totalProducts = data.productsCount || 1

    // Order status pipeline config
    const orderPipeline = [
        { key: 'pending', label: 'Pending', count: data.ordersByStatus.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', border: 'border-amber-500/20' },
        { key: 'confirmed', label: 'Confirmed', count: data.ordersByStatus.confirmed, icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
        { key: 'delivered', label: 'Delivered', count: data.ordersByStatus.delivered, icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
        { key: 'rejected', label: 'Rejected', count: data.ordersByStatus.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
        { key: 'cancelled', label: 'Cancelled', count: data.ordersByStatus.cancelled, icon: Ban, color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' },
    ]

    // Product status donut segments
    const productDonut = [
        { value: (data.productsByStatus.active / totalProducts) * 100, color: '#10b981' },
        { value: (data.productsByStatus.draft / totalProducts) * 100, color: '#f59e0b' },
        { value: (data.productsByStatus.archived / totalProducts) * 100, color: '#6b7280' },
    ]

    const orderStatusColors = {
        pending: 'bg-amber-100 text-amber-800',
        confirmed: 'bg-blue-100 text-blue-800',
        delivered: 'bg-emerald-100 text-emerald-800',
        rejected: 'bg-red-100 text-red-800',
        cancelled: 'bg-gray-100 text-gray-800',
    }

    return (
        <div className="space-y-6">
            {/* ─── Header ─── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Dashboard Overview</h1>
                    <p className="text-sm text-gray-500 mt-1">Welcome back! Here's what's happening with your store.</p>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Activity className="h-4 w-4 text-emerald-500 animate-pulse" />
                    <span>Live data</span>
                </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* ─── KPI Cards ─── */}
            {/* ═══════════════════════════════════════════ */}
            <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
                {/* Revenue */}
                <div className="relative overflow-hidden p-5 bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 rounded-xl border border-emerald-500/20 hover:border-emerald-500/40 transition-all duration-300 group">
                    <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-emerald-500/5 group-hover:bg-emerald-500/10 transition-colors" />
                    <div className="flex items-center justify-between relative">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-emerald-400/80">Revenue</p>
                            <p className="text-2xl font-bold text-emerald-400 mt-1">${data.revenue.toFixed(0)}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{data.ordersCount} orders total</p>
                        </div>
                        <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                            <DollarSign className="h-6 w-6 text-emerald-500" />
                        </div>
                    </div>
                </div>

                {/* Orders */}
                <div className="relative overflow-hidden p-5 bg-gradient-to-br from-blue-500/10 to-blue-600/5 rounded-xl border border-blue-500/20 hover:border-blue-500/40 transition-all duration-300 group">
                    <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-blue-500/5 group-hover:bg-blue-500/10 transition-colors" />
                    <div className="flex items-center justify-between relative">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-blue-400/80">Orders</p>
                            <p className="text-2xl font-bold text-blue-400 mt-1">{data.ordersCount}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{data.ordersByStatus.pending} pending</p>
                        </div>
                        <div className="p-2.5 bg-blue-500/10 rounded-xl">
                            <ShoppingCart className="h-6 w-6 text-blue-500" />
                        </div>
                    </div>
                </div>

                {/* Products */}
                <div className="relative overflow-hidden p-5 bg-gradient-to-br from-purple-500/10 to-purple-600/5 rounded-xl border border-purple-500/20 hover:border-purple-500/40 transition-all duration-300 group">
                    <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-purple-500/5 group-hover:bg-purple-500/10 transition-colors" />
                    <div className="flex items-center justify-between relative">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-purple-400/80">Products</p>
                            <p className="text-2xl font-bold text-purple-400 mt-1">{data.productsCount}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{data.totalVariants} variants</p>
                        </div>
                        <div className="p-2.5 bg-purple-500/10 rounded-xl">
                            <Package className="h-6 w-6 text-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Users */}
                <div className="relative overflow-hidden p-5 bg-gradient-to-br from-orange-500/10 to-orange-600/5 rounded-xl border border-orange-500/20 hover:border-orange-500/40 transition-all duration-300 group">
                    <div className="absolute -top-4 -right-4 h-20 w-20 rounded-full bg-orange-500/5 group-hover:bg-orange-500/10 transition-colors" />
                    <div className="flex items-center justify-between relative">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-orange-400/80">Customers</p>
                            <p className="text-2xl font-bold text-orange-400 mt-1">{data.usersCount}</p>
                            <p className="text-[10px] text-gray-500 mt-1">{data.reviewsCount} reviews ({data.avgRating.toFixed(1)} ★)</p>
                        </div>
                        <div className="p-2.5 bg-orange-500/10 rounded-xl">
                            <UsersIcon className="h-6 w-6 text-orange-500" />
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* ─── Order Pipeline + Product Status ─── */}
            {/* ═══════════════════════════════════════════ */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Order Status Pipeline */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-5">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <BarChart3 className="h-4 w-4 text-blue-500" />
                            Order Pipeline
                        </h2>
                        <Link to="/orders" className="text-xs text-blue-500 hover:text-blue-400 font-medium inline-flex items-center gap-1 transition-colors">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="grid grid-cols-5 gap-3">
                        {orderPipeline.map((step) => {
                            const Icon = step.icon
                            const pct = data.ordersCount ? Math.round((step.count / data.ordersCount) * 100) : 0
                            return (
                                <div key={step.key} className={cn("rounded-xl p-3 border text-center transition-all hover:scale-105", step.bg, step.border)}>
                                    <Icon className={cn("h-5 w-5 mx-auto mb-2", step.color)} />
                                    <p className={cn("text-xl font-bold", step.color)}>{step.count}</p>
                                    <p className="text-[10px] text-gray-500 mt-0.5">{step.label}</p>
                                    {/* Progress bar */}
                                    <div className="mt-2 h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                        <div className={cn("h-full rounded-full transition-all duration-1000", step.color.replace('text-', 'bg-'))} style={{ width: `${pct}%` }} />
                                    </div>
                                    <p className="text-[9px] text-gray-500 mt-1">{pct}%</p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Product Status Donut */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Package className="h-4 w-4 text-purple-500" />
                            Product Status
                        </h2>
                        <Link to="/products" className="text-xs text-blue-500 hover:text-blue-400 font-medium inline-flex items-center gap-1 transition-colors">
                            View <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    <div className="flex items-center justify-center gap-6">
                        <div className="relative">
                            <DonutChart segments={productDonut} size={100} strokeWidth={12} />
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                                <span className="text-lg font-bold text-gray-900 dark:text-white">{data.productsCount}</span>
                                <span className="text-[9px] text-gray-500">total</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">Active</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white ml-auto">{data.productsByStatus.active}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full bg-amber-500" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">Draft</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white ml-auto">{data.productsByStatus.draft}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="h-2.5 w-2.5 rounded-full bg-gray-500" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">Archived</span>
                                <span className="text-xs font-bold text-gray-900 dark:text-white ml-auto">{data.productsByStatus.archived}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* ─── Inventory + Categories + Quick Actions ─── */}
            {/* ═══════════════════════════════════════════ */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Inventory Alerts */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <Box className="h-4 w-4 text-indigo-500" />
                        Inventory Overview
                    </h2>
                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                            <div className="flex items-center gap-2">
                                <Layers className="h-4 w-4 text-purple-500" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">Total Variants</span>
                            </div>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{data.totalVariants}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-emerald-500" />
                                <span className="text-xs text-gray-600 dark:text-gray-400">Total Stock</span>
                            </div>
                            <span className="text-sm font-bold text-emerald-500">{data.totalStock}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-red-50/50 dark:bg-red-900/10 border border-red-200/50 dark:border-red-800/20">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                <span className="text-xs text-red-600 dark:text-red-400">Out of Stock</span>
                            </div>
                            <span className="text-sm font-bold text-red-500">{data.outOfStock}</span>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-200/50 dark:border-amber-800/20">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="h-4 w-4 text-amber-500" />
                                <span className="text-xs text-amber-600 dark:text-amber-400">Low Stock (&lt;10)</span>
                            </div>
                            <span className="text-sm font-bold text-amber-500">{data.lowStock}</span>
                        </div>
                    </div>
                </div>

                {/* Top Categories Bar Chart */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <Tag className="h-4 w-4 text-pink-500" />
                            Categories
                        </h2>
                        <span className="text-xs text-gray-500">{data.categoriesCount} total</span>
                    </div>
                    {data.topCategories.length > 0 ? (
                        <div className="space-y-2.5">
                            {data.topCategories.map((cat, i) => {
                                const max = data.topCategories[0]?.count || 1
                                const pct = (cat.count / max) * 100
                                const barColors = ['bg-pink-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-indigo-500']
                                return (
                                    <div key={cat.name} className="group">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="text-gray-600 dark:text-gray-400 font-medium">{cat.name}</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{cat.count}</span>
                                        </div>
                                        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={cn("h-full rounded-full transition-all duration-700 ease-out", barColors[i % barColors.length])}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-xs text-gray-500 text-center py-6">No categories yet</p>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <TrendingUp className="h-4 w-4 text-cyan-500" />
                        Quick Actions
                    </h2>
                    <div className="space-y-2">
                        <Link to="/products/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-blue-500/5 border border-transparent hover:border-blue-500/20 transition-all group">
                            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-500 group-hover:bg-blue-500/20 transition-colors">
                                <Plus className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Add Product</p>
                                <p className="text-[10px] text-gray-500">Create a new product listing</p>
                            </div>
                        </Link>
                        <Link to="/categories/new" className="flex items-center gap-3 p-3 rounded-lg hover:bg-pink-500/5 border border-transparent hover:border-pink-500/20 transition-all group">
                            <div className="p-2 rounded-lg bg-pink-500/10 text-pink-500 group-hover:bg-pink-500/20 transition-colors">
                                <Tag className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Add Category</p>
                                <p className="text-[10px] text-gray-500">Organize your products</p>
                            </div>
                        </Link>
                        <Link to="/orders" className="flex items-center gap-3 p-3 rounded-lg hover:bg-amber-500/5 border border-transparent hover:border-amber-500/20 transition-all group">
                            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500 group-hover:bg-amber-500/20 transition-colors">
                                <Eye className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">View Orders</p>
                                <p className="text-[10px] text-gray-500">{data.ordersByStatus.pending} pending orders</p>
                            </div>
                        </Link>
                        <Link to="/users" className="flex items-center gap-3 p-3 rounded-lg hover:bg-purple-500/5 border border-transparent hover:border-purple-500/20 transition-all group">
                            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-500 group-hover:bg-purple-500/20 transition-colors">
                                <UsersIcon className="h-4 w-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">Manage Users</p>
                                <p className="text-[10px] text-gray-500">{data.usersCount} registered customers</p>
                            </div>
                        </Link>
                    </div>
                </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* ─── Recent Orders + Store Stats ─── */}
            {/* ═══════════════════════════════════════════ */}
            <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
                {/* Recent Orders */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                            <ShoppingCart className="h-4 w-4 text-blue-500" />
                            Recent Orders
                        </h2>
                        <Link to="/orders" className="text-xs text-blue-500 hover:text-blue-400 font-medium inline-flex items-center gap-1 transition-colors">
                            View all <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                    {data.recentOrders.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full text-xs">
                                <thead className="text-gray-500 uppercase border-b border-gray-200 dark:border-gray-700">
                                    <tr>
                                        <th className="pb-2 text-left font-semibold">Order</th>
                                        <th className="pb-2 text-left font-semibold">Customer</th>
                                        <th className="pb-2 text-right font-semibold">Amount</th>
                                        <th className="pb-2 text-center font-semibold">Status</th>
                                        <th className="pb-2 text-right font-semibold">Date</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.recentOrders.map(order => (
                                        <tr key={order.id} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                            <td className="py-3">
                                                <Link to={`/orders/${order.id}`} className="font-mono font-medium text-blue-500 hover:text-blue-400 transition-colors">
                                                    #{order.order_number}
                                                </Link>
                                            </td>
                                            <td className="py-3 text-gray-700 dark:text-gray-300">
                                                {order.customer_first_name} {order.customer_last_name}
                                            </td>
                                            <td className="py-3 text-right font-semibold text-gray-900 dark:text-white">
                                                ${parseFloat(order.total_amount).toFixed(2)}
                                            </td>
                                            <td className="py-3 text-center">
                                                <span className={cn("px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize", orderStatusColors[order.status] || "bg-gray-100 text-gray-800")}>
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="py-3 text-right text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8 text-xs text-gray-500">No orders yet</div>
                    )}
                </div>

                {/* Store Stats Summary */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                    <h2 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                        <BarChart3 className="h-4 w-4 text-indigo-500" />
                        Store Summary
                    </h2>
                    <div className="space-y-3">
                        {[
                            { label: 'Categories', value: data.categoriesCount, icon: Tag, color: 'text-pink-500' },
                            { label: 'Product Types', value: data.productTypes.length, icon: Layers, color: 'text-indigo-500' },
                            { label: 'Total Reviews', value: data.reviewsCount, icon: Star, color: 'text-amber-500' },
                            { label: 'Avg Rating', value: `${data.avgRating.toFixed(1)} ★`, icon: Star, color: 'text-yellow-500' },
                            { label: 'Avg Order Value', value: `$${data.ordersCount ? (data.revenue / data.ordersCount).toFixed(0) : 0}`, icon: DollarSign, color: 'text-emerald-500' },
                        ].map(item => {
                            const Icon = item.icon
                            return (
                                <div key={item.label} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                    <div className="flex items-center gap-2">
                                        <Icon className={cn("h-4 w-4", item.color)} />
                                        <span className="text-xs text-gray-600 dark:text-gray-400">{item.label}</span>
                                    </div>
                                    <span className="text-sm font-bold text-gray-900 dark:text-white">{item.value}</span>
                                </div>
                            )
                        })}
                    </div>
                    {data.productTypes.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
                            <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-2">Product Types</p>
                            <div className="flex flex-wrap gap-1.5">
                                {data.productTypes.map(t => (
                                    <span key={t.id} className="px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-medium">
                                        {t.name}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
