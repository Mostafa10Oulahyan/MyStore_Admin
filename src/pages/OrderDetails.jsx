import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, User, MapPin, CreditCard, Phone, Clock, CheckCircle, Truck, XCircle, Ban, Package } from 'lucide-react'
import { cn } from '../lib/utils'

const statusConfig = {
    pending: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500', label: 'Order Placed' },
    confirmed: { icon: CheckCircle, color: 'text-blue-500', bg: 'bg-blue-500', label: 'Confirmed' },
    delivered: { icon: Truck, color: 'text-emerald-500', bg: 'bg-emerald-500', label: 'Delivered' },
    rejected: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500', label: 'Rejected' },
    cancelled: { icon: Ban, color: 'text-gray-400', bg: 'bg-gray-400', label: 'Cancelled' },
}

// Build timeline steps from order timestamps
function buildTimeline(order) {
    if (!order) return []

    const steps = []

    // Step 1: Order Placed (always exists)
    steps.push({
        key: 'placed',
        label: 'Order Placed',
        description: `Order #${order.order_number} was created`,
        time: order.created_at,
        icon: Package,
        color: 'text-blue-500',
        bg: 'bg-blue-500',
        done: true,
    })

    // Normal flow: Pending → Confirmed → Delivered
    // Or: Rejected / Cancelled

    if (order.status === 'rejected') {
        steps.push({
            key: 'rejected',
            label: 'Rejected',
            description: 'Order was rejected',
            time: order.rejected_at || order.updated_at,
            icon: XCircle,
            color: 'text-red-500',
            bg: 'bg-red-500',
            done: true,
        })
        return steps
    }

    if (order.status === 'cancelled') {
        steps.push({
            key: 'cancelled',
            label: 'Cancelled',
            description: 'Order was cancelled',
            time: order.updated_at,
            icon: Ban,
            color: 'text-gray-400',
            bg: 'bg-gray-400',
            done: true,
        })
        return steps
    }

    // Step 2: Confirmed
    const isConfirmed = ['confirmed', 'delivered'].includes(order.status)
    steps.push({
        key: 'confirmed',
        label: 'Confirmed',
        description: isConfirmed ? 'Order confirmed by admin' : 'Awaiting confirmation',
        time: order.confirmed_at,
        icon: CheckCircle,
        color: isConfirmed ? 'text-blue-500' : 'text-gray-400',
        bg: isConfirmed ? 'bg-blue-500' : 'bg-gray-600',
        done: isConfirmed,
    })

    // Step 3: Delivered
    const isDelivered = order.status === 'delivered'
    steps.push({
        key: 'delivered',
        label: 'Delivered',
        description: isDelivered ? 'Order delivered successfully' : 'Pending delivery',
        time: order.delivered_at,
        icon: Truck,
        color: isDelivered ? 'text-emerald-500' : 'text-gray-400',
        bg: isDelivered ? 'bg-emerald-500' : 'bg-gray-600',
        done: isDelivered,
    })

    return steps
}

export default function OrderDetails() {
    const { id } = useParams()
    const navigate = useNavigate()
    const [order, setOrder] = useState(null)
    const [items, setItems] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOrderDetails()
    }, [id])

    async function fetchOrderDetails() {
        setLoading(true)
        const { data: orderData, error: orderError } = await supabase
            .from('orders')
            .select('*')
            .eq('id', id)
            .single()

        if (orderError) {
            console.error('Error fetching order:', orderError)
        } else {
            let finalOrder = orderData
            if (orderData.delivery_address_id) {
                const { data: addressData } = await supabase
                    .from('addresses')
                    .select('*')
                    .eq('id', orderData.delivery_address_id)
                    .single()

                if (addressData) {
                    finalOrder = {
                        ...orderData,
                        customer_first_name: addressData.first_name,
                        customer_last_name: addressData.last_name,
                        customer_address: addressData.street_address,
                        customer_city: addressData.city,
                        customer_phone: addressData.phone_number
                    }
                }
            }
            setOrder(finalOrder)

            const { data: itemsData, error: itemsError } = await supabase
                .from('order_items')
                .select('*')
                .eq('order_id', id)

            if (itemsError) console.error('Error fetching items:', itemsError)
            else setItems(itemsData || [])
        }
        setLoading(false)
    }

    async function updateStatus(newStatus) {
        const updatePayload = { status: newStatus, updated_at: new Date().toISOString() }

        // Set the appropriate timestamp
        if (newStatus === 'confirmed') updatePayload.confirmed_at = new Date().toISOString()
        if (newStatus === 'delivered') updatePayload.delivered_at = new Date().toISOString()
        if (newStatus === 'rejected') updatePayload.rejected_at = new Date().toISOString()

        const { error } = await supabase
            .from('orders')
            .update(updatePayload)
            .eq('id', id)

        if (error) {
            alert('Error updating status: ' + error.message)
        } else {
            setOrder(prev => ({ ...prev, ...updatePayload }))
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
        </div>
    )
    if (!order) return <div className="p-8 text-center text-red-500">Order not found.</div>

    const timeline = buildTimeline(order)
    const currentCfg = statusConfig[order.status] || statusConfig.pending

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* ─── Header ─── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/orders" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Order #{order.order_number}</h1>
                        <p className="text-sm text-gray-500">{new Date(order.created_at).toLocaleString()}</p>
                    </div>
                </div>
                <div>
                    <select
                        className={cn(
                            "block w-full rounded-md border py-2 pl-3 pr-10 text-base focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm",
                            "font-semibold uppercase",
                            order.status === 'delivered' ? "bg-green-100 text-green-800 border-green-200" :
                                order.status === 'confirmed' ? "bg-blue-100 text-blue-800 border-blue-200" :
                                    order.status === 'pending' ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                                        order.status === 'rejected' ? "bg-red-100 text-red-800 border-red-200" :
                                            "bg-gray-100 text-gray-800 border-gray-200"
                        )}
                        value={order.status}
                        onChange={(e) => updateStatus(e.target.value)}
                    >
                        <option value="pending">Pending</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                        <option value="rejected">Rejected</option>
                    </select>
                </div>
            </div>

            {/* ═══════════════════════════════════════════ */}
            {/* ─── Status Tracking Timeline ─── */}
            {/* ═══════════════════════════════════════════ */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-5 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    Order Tracking
                </h2>
                <div className="relative">
                    {/* Connector line */}
                    <div className="absolute left-5 top-6 bottom-6 w-0.5 bg-gray-200 dark:bg-gray-700" />

                    <div className="space-y-0">
                        {timeline.map((step, idx) => {
                            const Icon = step.icon
                            const isLast = idx === timeline.length - 1
                            return (
                                <div key={step.key} className="relative flex items-start gap-4 pb-6 last:pb-0">
                                    {/* Circle / Icon */}
                                    <div className={cn(
                                        "relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                                        step.done
                                            ? cn("border-transparent", step.bg, "shadow-lg")
                                            : "border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700"
                                    )}>
                                        <Icon className={cn("h-4 w-4", step.done ? "text-white" : "text-gray-400")} />
                                        {step.done && isLast && (
                                            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
                                                <span className={cn("absolute inset-0 rounded-full opacity-75 animate-ping", step.bg)} />
                                                <span className={cn("relative inline-flex rounded-full h-3 w-3", step.bg)} />
                                            </span>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0 pt-1">
                                        <div className="flex items-center justify-between">
                                            <p className={cn(
                                                "text-sm font-semibold",
                                                step.done ? "text-gray-900 dark:text-white" : "text-gray-400"
                                            )}>
                                                {step.label}
                                            </p>
                                            {step.time ? (
                                                <span className="text-[10px] text-gray-500 font-mono">
                                                    {new Date(step.time).toLocaleString('en-US', {
                                                        month: 'short', day: 'numeric',
                                                        hour: '2-digit', minute: '2-digit'
                                                    })}
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-gray-500 italic">Pending</span>
                                            )}
                                        </div>
                                        <p className={cn("text-xs mt-0.5", step.done ? "text-gray-500" : "text-gray-400")}>
                                            {step.description}
                                        </p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order Items */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                        <h2 className="text-lg font-medium mb-4">Order Items</h2>
                        <div className="divide-y divide-gray-200 dark:divide-gray-700">
                            {items.map((item) => (
                                <div key={item.id} className="py-4 flex items-center justify-between">
                                    <div className="flex items-center">
                                        {item.product_image_url && (
                                            <img src={item.product_image_url} alt={item.product_name} className="h-16 w-16 object-cover rounded-md mr-4" />
                                        )}
                                        <div>
                                            <p className="font-medium text-gray-900 dark:text-white">{item.product_name}</p>
                                            <p className="text-sm text-gray-500">
                                                {item.color} / {item.size} x {item.quantity}
                                            </p>
                                        </div>
                                    </div>
                                    <p className="font-medium text-gray-900 dark:text-white">${item.subtotal}</p>
                                </div>
                            ))}
                        </div>
                        <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium">${order.subtotal}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-500">Shipping</span>
                                <span className="font-medium">${order.shipping_cost}</span>
                            </div>
                            <div className="flex justify-between text-base font-bold text-gray-900 dark:text-white pt-2 border-t border-gray-200 dark:border-gray-700">
                                <span>Total</span>
                                <span>${order.total_amount}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Customer & Shipping Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-400" />
                                <h2 className="text-lg font-medium">Customer</h2>
                            </div>
                            {order.user_id ? (
                                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-semibold">Registered</span>
                            ) : (
                                <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full font-semibold">Guest</span>
                            )}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-300 space-y-2">
                            <p className="font-medium text-gray-900 dark:text-white text-lg">{order.customer_first_name} {order.customer_last_name}</p>
                            <p className="flex items-center gap-2">
                                <span className="text-gray-400">Email:</span> {order.customer_email || 'N/A'}
                            </p>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400">Phone:</span>
                                <span className="font-medium text-gray-900 dark:text-white">{order.customer_phone}</span>
                            </div>

                            <a href={`tel:${order.customer_phone}`} className="mt-4 flex items-center justify-center w-full gap-2 bg-green-600 hover:bg-green-700 text-white py-2 rounded-md transition-colors font-medium">
                                <Phone className="h-4 w-4" />
                                Call to Confirm
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* Shipping Address */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-gray-400" />
                    <h2 className="text-lg font-medium">Shipping Address</h2>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p>{order.customer_address}</p>
                    <p>{order.customer_city}</p>
                </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="h-5 w-5 text-gray-400" />
                    <h2 className="text-lg font-medium">Payment Info</h2>
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    <p className="capitalize">Method: {order.payment_method}</p>
                </div>
            </div>
        </div>
    )
}
