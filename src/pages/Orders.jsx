import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Link } from 'react-router-dom'
import { Eye, Search, Trash2, Clock, CheckCircle, Truck, XCircle, Ban, X, History, ShoppingCart } from 'lucide-react'
import { cn } from '../lib/utils'

export default function Orders() {
    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [activeTab, setActiveTab] = useState('active')
    const [statusFilter, setStatusFilter] = useState(null) // null = all within tab
    const [deleteModal, setDeleteModal] = useState({ open: false, order: null })
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchOrders()
    }, [])

    async function fetchOrders() {
        setLoading(true)
        const { data, error } = await supabase
            .from('orders')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching orders:', error)
        } else {
            setOrders(data || [])
        }
        setLoading(false)
    }

    async function handleDelete() {
        if (!deleteModal.order) return
        setDeleting(true)
        try {
            await supabase.from('order_items').delete().eq('order_id', deleteModal.order.id)
            const { error } = await supabase.from('orders').delete().eq('id', deleteModal.order.id)
            if (error) throw error
            setOrders(prev => prev.filter(o => o.id !== deleteModal.order.id))
            setDeleteModal({ open: false, order: null })
        } catch (error) {
            alert('Error deleting order: ' + error.message)
        } finally {
            setDeleting(false)
        }
    }

    // Split into active and history (history = delivered only)
    const activeOrders = orders.filter(o => o.status !== 'delivered')
    const historyOrders = orders.filter(o => o.status === 'delivered')

    const currentOrders = activeTab === 'active' ? activeOrders : historyOrders

    // Apply status filter on top
    const statusFilteredOrders = statusFilter
        ? currentOrders.filter(o => o.status === statusFilter)
        : currentOrders

    const filteredOrders = statusFilteredOrders.filter(order =>
        order.order_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customer_first_name + ' ' + order.customer_last_name).toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Status counts
    const statusCounts = {
        pending: orders.filter(o => o.status === 'pending').length,
        confirmed: orders.filter(o => o.status === 'confirmed').length,
        delivered: orders.filter(o => o.status === 'delivered').length,
        rejected: orders.filter(o => o.status === 'rejected').length,
        cancelled: orders.filter(o => o.status === 'cancelled').length,
    }

    const statusConfig = {
        pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-100 text-amber-800', cardBg: 'from-amber-500/10 to-amber-600/5', border: 'border-amber-500/20', activeBorder: 'border-amber-500 ring-2 ring-amber-500/30' },
        confirmed: { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-100 text-blue-800', cardBg: 'from-blue-500/10 to-blue-600/5', border: 'border-blue-500/20', activeBorder: 'border-blue-500 ring-2 ring-blue-500/30' },
        delivered: { icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-100 text-emerald-800', cardBg: 'from-emerald-500/10 to-emerald-600/5', border: 'border-emerald-500/20', activeBorder: 'border-emerald-500 ring-2 ring-emerald-500/30' },
        rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100 text-red-800', cardBg: 'from-red-500/10 to-red-600/5', border: 'border-red-500/20', activeBorder: 'border-red-500 ring-2 ring-red-500/30' },
        cancelled: { icon: Ban, color: 'text-gray-400', bg: 'bg-gray-100 text-gray-800', cardBg: 'from-gray-500/10 to-gray-600/5', border: 'border-gray-500/20', activeBorder: 'border-gray-400 ring-2 ring-gray-400/30' },
    }

    function toggleStatusFilter(status) {
        setStatusFilter(prev => prev === status ? null : status)
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Orders</h1>
                    <p className="text-sm text-gray-500">Manage customer orders</p>
                </div>
            </div>

            {/* ─── Clickable Status Filter Cards ─── */}
            {!loading && (
                <div className="grid grid-cols-5 gap-3">
                    {Object.entries(statusCounts).map(([status, count]) => {
                        const cfg = statusConfig[status]
                        const Icon = cfg.icon
                        const isActive = statusFilter === status
                        return (
                            <button
                                key={status}
                                onClick={() => toggleStatusFilter(status)}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-xl bg-gradient-to-br border transition-all duration-300 cursor-pointer text-left",
                                    cfg.cardBg,
                                    isActive ? cfg.activeBorder : cfg.border,
                                    "hover:scale-105"
                                )}
                            >
                                <Icon className={cn("h-5 w-5 shrink-0", cfg.color)} />
                                <div>
                                    <p className={cn("text-lg font-bold", cfg.color)}>{count}</p>
                                    <p className="text-[10px] text-gray-500 capitalize">{status}</p>
                                </div>
                                {isActive && (
                                    <span className="ml-auto px-1.5 py-0.5 bg-white/10 backdrop-blur-sm rounded text-[8px] font-bold text-white/80 uppercase tracking-wider">
                                        Filter
                                    </span>
                                )}
                            </button>
                        )
                    })}
                </div>
            )}

            {/* ─── Tabs: Active / History ─── */}
            <div className="flex items-center gap-6 border-b border-gray-200 dark:border-gray-700">
                <button
                    onClick={() => { setActiveTab('active'); setStatusFilter(null) }}
                    className={cn(
                        "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'active'
                            ? "border-blue-500 text-blue-600 dark:text-blue-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                >
                    <ShoppingCart className="h-4 w-4" />
                    Active Orders
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        activeTab === 'active' ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    )}>
                        {activeOrders.length}
                    </span>
                </button>
                <button
                    onClick={() => { setActiveTab('history'); setStatusFilter(null) }}
                    className={cn(
                        "flex items-center gap-2 pb-3 text-sm font-medium border-b-2 transition-colors",
                        activeTab === 'history'
                            ? "border-emerald-500 text-emerald-600 dark:text-emerald-400"
                            : "border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    )}
                >
                    <History className="h-4 w-4" />
                    Order History
                    <span className={cn(
                        "px-2 py-0.5 rounded-full text-xs font-bold",
                        activeTab === 'history' ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                    )}>
                        {historyOrders.length}
                    </span>
                </button>
            </div>

            {/* ─── Search + active filter indicator ─── */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700 max-w-sm flex-1">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search order # or customer..."
                        className="flex-1 bg-transparent outline-none text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                {statusFilter && (
                    <button
                        onClick={() => setStatusFilter(null)}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg bg-white/5 border border-gray-600 text-gray-300 hover:bg-white/10 transition-colors"
                    >
                        <X className="h-3 w-3" />
                        Clear filter: <span className="capitalize font-semibold">{statusFilter}</span>
                    </button>
                )}
            </div>

            {/* ─── Orders Table ─── */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-6 py-3">Order #</th>
                                <th className="px-6 py-3">Date</th>
                                <th className="px-6 py-3">Customer</th>
                                <th className="px-6 py-3">Total</th>
                                <th className="px-6 py-3">Payment</th>
                                <th className="px-6 py-3">Status</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="7" className="px-6 py-10 text-center text-gray-500">Loading orders...</td></tr>
                            ) : filteredOrders.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="px-6 py-10 text-center text-gray-500">
                                        {statusFilter
                                            ? `No ${statusFilter} orders found.`
                                            : activeTab === 'active' ? 'No active orders.' : 'No order history yet.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredOrders.map((order) => {
                                    const cfg = statusConfig[order.status] || statusConfig.pending
                                    const Icon = cfg.icon
                                    const canDelete = order.status === 'cancelled' || order.status === 'rejected'
                                    return (
                                        <tr key={order.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-6 py-4">
                                                <Link to={`/orders/${order.id}`} className="font-mono font-medium text-blue-500 hover:text-blue-400 transition-colors">
                                                    #{order.order_number}
                                                </Link>
                                            </td>
                                            <td className="px-6 py-4 text-gray-500">
                                                {new Date(order.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                                                {order.customer_first_name} {order.customer_last_name}
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white">
                                                ${parseFloat(order.total_amount).toFixed(2)}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 uppercase">
                                                    {order.payment_method || 'cod'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold capitalize", cfg.bg)}>
                                                    <Icon className="h-3 w-3" />
                                                    {order.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1">
                                                    <Link
                                                        to={`/orders/${order.id}`}
                                                        className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                                                        title="View order details"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    {canDelete && (
                                                        <button
                                                            onClick={() => setDeleteModal({ open: true, order })}
                                                            className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                                            title="Delete order"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ─── Delete Confirmation Modal ─── */}
            {deleteModal.open && deleteModal.order && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteModal({ open: false, order: null })}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                <Trash2 className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Order</h3>
                            <p className="text-sm text-gray-500">
                                Are you sure you want to permanently delete order <strong className="text-gray-700 dark:text-gray-300 font-mono">#{deleteModal.order.order_number}</strong>? This will remove the order and all its items. This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setDeleteModal({ open: false, order: null })}
                                disabled={deleting}
                                className="flex-1 py-3 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-r border-gray-200 dark:border-gray-700 disabled:opacity-50"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={deleting}
                                className="flex-1 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors disabled:opacity-50"
                            >
                                {deleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
