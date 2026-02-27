import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit, Trash, Search, Eye, Package, FileText, Archive, X, Layers, Box } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'

export default function Products() {
    const navigate = useNavigate()
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [statusFilter, setStatusFilter] = useState(null) // null = all, 'active' | 'draft' | 'archived'
    const [deleteModal, setDeleteModal] = useState({ open: false, product: null })
    const [viewModal, setViewModal] = useState({ open: false, product: null })
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        setLoading(true)
        const { data, error } = await supabase
            .from('products')
            .select('*, categories(name), product_types(name), product_variants(id, color, color_hex, size, sku, price, stock_quantity, is_available)')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching products:', error)
        } else {
            setProducts(data || [])
        }
        setLoading(false)
    }

    async function handleDelete() {
        if (!deleteModal.product) return
        setDeleting(true)
        try {
            await supabase.from('product_images').delete().eq('product_id', deleteModal.product.id)
            await supabase.from('product_variants').delete().eq('product_id', deleteModal.product.id)

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', deleteModal.product.id)

            if (error) throw error
            setProducts(prev => prev.filter(p => p.id !== deleteModal.product.id))
            setDeleteModal({ open: false, product: null })
        } catch (error) {
            alert('Error deleting product: ' + error.message)
        } finally {
            setDeleting(false)
        }
    }

    // Filter by search + status
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesStatus = statusFilter ? product.status === statusFilter : true
        return matchesSearch && matchesStatus
    })

    // Status stats
    const statusCounts = {
        active: products.filter(p => p.status === 'active').length,
        draft: products.filter(p => p.status === 'draft').length,
        archived: products.filter(p => p.status === 'archived').length,
    }
    const total = products.length

    // Helper to get variant summary
    function getVariantSummary(variants) {
        if (!variants || variants.length === 0) return { count: 0, totalStock: 0, availableCount: 0 }
        const totalStock = variants.reduce((sum, v) => sum + (v.stock_quantity || 0), 0)
        const availableCount = variants.filter(v => v.is_available).length
        return { count: variants.length, totalStock, availableCount }
    }

    function toggleStatusFilter(status) {
        setStatusFilter(prev => prev === status ? null : status)
    }

    const statusCards = [
        {
            key: 'active',
            label: 'Active',
            count: statusCounts.active,
            icon: Package,
            colors: {
                bg: 'from-emerald-500/10 to-emerald-600/5',
                border: statusFilter === 'active' ? 'border-emerald-500 ring-2 ring-emerald-500/30' : 'border-emerald-500/20 hover:border-emerald-500/40',
                pulse: 'bg-emerald-500 shadow-emerald-500/50',
                ring: 'text-emerald-900/20',
                ringActive: 'text-emerald-500',
                icon: 'text-emerald-500',
                label: 'text-emerald-400/80',
                value: 'text-emerald-400',
            }
        },
        {
            key: 'draft',
            label: 'Draft',
            count: statusCounts.draft,
            icon: FileText,
            colors: {
                bg: 'from-amber-500/10 to-amber-600/5',
                border: statusFilter === 'draft' ? 'border-amber-500 ring-2 ring-amber-500/30' : 'border-amber-500/20 hover:border-amber-500/40',
                pulse: 'bg-amber-500 shadow-amber-500/50',
                ring: 'text-amber-900/20',
                ringActive: 'text-amber-500',
                icon: 'text-amber-500',
                label: 'text-amber-400/80',
                value: 'text-amber-400',
            }
        },
        {
            key: 'archived',
            label: 'Archived',
            count: statusCounts.archived,
            icon: Archive,
            colors: {
                bg: 'from-gray-500/10 to-gray-600/5',
                border: statusFilter === 'archived' ? 'border-gray-400 ring-2 ring-gray-400/30' : 'border-gray-500/20 hover:border-gray-500/40',
                pulse: 'bg-gray-400 shadow-gray-400/50',
                ring: 'text-gray-700/30',
                ringActive: 'text-gray-400',
                icon: 'text-gray-400',
                label: 'text-gray-400/80',
                value: 'text-gray-400',
            }
        },
    ]

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Products</h1>
                    <p className="text-sm text-gray-500">Manage your store products</p>
                </div>
                <Link
                    to="/products/new"
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Product
                </Link>
            </div>

            {/* ─── Clickable Product Status Stats ─── */}
            {!loading && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {statusCards.map(card => {
                        const Icon = card.icon
                        const pct = total ? Math.round((card.count / total) * 100) : 0
                        const isActive = statusFilter === card.key

                        return (
                            <button
                                key={card.key}
                                onClick={() => toggleStatusFilter(card.key)}
                                className={cn(
                                    "relative overflow-hidden rounded-xl bg-gradient-to-br border p-5 text-left transition-all duration-300 cursor-pointer",
                                    card.colors.bg,
                                    card.colors.border,
                                    isActive && "scale-[1.02]"
                                )}
                            >
                                {isActive && (
                                    <div className="absolute top-2 left-2 px-1.5 py-0.5 bg-white/10 backdrop-blur-sm rounded text-[10px] font-semibold text-white/80 uppercase tracking-wider">
                                        Filtering
                                    </div>
                                )}
                                <div className={cn("absolute top-3 right-3 h-3 w-3 rounded-full animate-pulse shadow-lg", card.colors.pulse)} />
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <svg className="h-16 w-16 -rotate-90 transform" viewBox="0 0 36 36">
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none" stroke="currentColor" strokeWidth="2.5"
                                                className={card.colors.ring}
                                            />
                                            <path
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                                fill="none" stroke="currentColor" strokeWidth="2.5"
                                                strokeDasharray={`${pct}, 100`}
                                                className={cn(card.colors.ringActive, "transition-all duration-1000 ease-out")}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Icon className={cn("h-5 w-5", card.colors.icon)} />
                                        </div>
                                    </div>
                                    <div>
                                        <p className={cn("text-xs font-semibold uppercase tracking-wider", card.colors.label)}>{card.label}</p>
                                        <p className={cn("text-3xl font-bold mt-0.5", card.colors.value)}>{card.count}</p>
                                        <p className="text-xs text-gray-500 mt-1">{pct}% of total</p>
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            )}

            {/* Search + active filter indicator */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 p-2 rounded-md border border-gray-200 dark:border-gray-700 max-w-sm flex-1">
                    <Search className="h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search products..."
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

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                            <tr>
                                <th className="px-5 py-3">Product Name</th>
                                <th className="px-5 py-3">Category</th>
                                <th className="px-5 py-3">Type</th>
                                <th className="px-5 py-3">Price</th>
                                <th className="px-5 py-3">Variants</th>
                                <th className="px-5 py-3">Stock</th>
                                <th className="px-5 py-3">Status</th>
                                <th className="px-5 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-gray-500">Loading products...</td>
                                </tr>
                            ) : filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-10 text-center text-gray-500">
                                        {statusFilter ? `No ${statusFilter} products found.` : 'No products found.'}
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => {
                                    const vs = getVariantSummary(product.product_variants)
                                    return (
                                        <tr key={product.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                            <td className="px-5 py-4 font-medium text-gray-900 dark:text-white">
                                                {product.name}
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                                                {product.categories?.name || '-'}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-medium">
                                                    <Layers className="h-3 w-3" />
                                                    {product.product_types?.name || '-'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 font-semibold text-gray-900 dark:text-white">
                                                ${product.base_price}
                                            </td>
                                            <td className="px-5 py-4">
                                                {vs.count > 0 ? (
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-semibold">
                                                            <Box className="h-3 w-3" />
                                                            {vs.count}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500">
                                                            ({vs.availableCount} avail)
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-gray-500 italic">No variants</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                {vs.count > 0 ? (
                                                    <span className={cn(
                                                        "text-sm font-semibold",
                                                        vs.totalStock === 0 ? "text-red-400" :
                                                            vs.totalStock < 10 ? "text-amber-400" :
                                                                "text-emerald-400"
                                                    )}>
                                                        {vs.totalStock}
                                                        {vs.totalStock === 0 && <span className="ml-1 text-[10px] font-normal text-red-400/70">out</span>}
                                                        {vs.totalStock > 0 && vs.totalStock < 10 && <span className="ml-1 text-[10px] font-normal text-amber-400/70">low</span>}
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-gray-500">-</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4">
                                                <span className={cn(
                                                    "px-2 py-1 rounded-full text-xs font-semibold",
                                                    product.status === 'active' ? "bg-green-100 text-green-800" :
                                                        product.status === 'draft' ? "bg-yellow-100 text-yellow-800" :
                                                            "bg-gray-100 text-gray-800"
                                                )}>
                                                    {product.status}
                                                </span>
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end space-x-1">
                                                    <button
                                                        onClick={() => setViewModal({ open: true, product })}
                                                        className="p-1.5 text-gray-500 hover:text-blue-500 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                                                        title="View product"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => navigate(`/products/${product.id}/edit`)}
                                                        className="p-1.5 text-gray-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
                                                        title="Edit product"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => setDeleteModal({ open: true, product })}
                                                        className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                                        title="Delete product"
                                                    >
                                                        <Trash className="h-4 w-4" />
                                                    </button>
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

            {/* ─── View Product Modal ─── */}
            {viewModal.open && viewModal.product && (() => {
                const p = viewModal.product
                const vs = getVariantSummary(p.product_variants)
                return (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setViewModal({ open: false, product: null })}>
                        <div
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-2xl mx-4 overflow-hidden max-h-[85vh] flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/5 to-purple-500/5">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Product Details</h2>
                                <button
                                    onClick={() => setViewModal({ open: false, product: null })}
                                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                            <div className="p-5 space-y-5 overflow-y-auto">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Name</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">{p.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Slug</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-300 font-mono">{p.slug}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Category</p>
                                        <p className="text-sm text-gray-700 dark:text-gray-300">{p.categories?.name || '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Product Type</p>
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-xs font-medium">
                                            <Layers className="h-3 w-3" />
                                            {p.product_types?.name || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Base Price</p>
                                        <p className="text-lg font-bold text-emerald-500">${p.base_price}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Compare Price</p>
                                        <p className="text-sm text-gray-500 line-through">{p.compare_at_price ? `$${p.compare_at_price}` : '-'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Status</p>
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-semibold",
                                            p.status === 'active' ? "bg-green-100 text-green-800" :
                                                p.status === 'draft' ? "bg-yellow-100 text-yellow-800" :
                                                    "bg-gray-100 text-gray-800"
                                        )}>
                                            {p.status}
                                        </span>
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Featured</p>
                                        <p className="text-sm">{p.featured ? '⭐ Yes' : 'No'}</p>
                                    </div>
                                </div>

                                {p.description && (
                                    <div>
                                        <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description</p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{p.description}</p>
                                    </div>
                                )}

                                {/* ─── Variants Section ─── */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                                    <div className="flex items-center justify-between mb-3">
                                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                                            <Box className="h-4 w-4 text-purple-500" />
                                            Product Variants
                                            <span className="ml-1 px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-bold">{vs.count}</span>
                                        </h3>
                                        <div className="flex items-center gap-3 text-xs text-gray-500">
                                            <span>Stock: <strong className={cn(vs.totalStock === 0 ? "text-red-400" : vs.totalStock < 10 ? "text-amber-400" : "text-emerald-400")}>{vs.totalStock}</strong></span>
                                            <span>Available: <strong className="text-blue-400">{vs.availableCount}</strong></span>
                                        </div>
                                    </div>
                                    {p.product_variants && p.product_variants.length > 0 ? (
                                        <div className="rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                                            <table className="w-full text-xs">
                                                <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-500 uppercase">
                                                    <tr>
                                                        <th className="px-3 py-2 text-left">Color</th>
                                                        <th className="px-3 py-2 text-left">Size</th>
                                                        <th className="px-3 py-2 text-left">SKU</th>
                                                        <th className="px-3 py-2 text-right">Price</th>
                                                        <th className="px-3 py-2 text-right">Stock</th>
                                                        <th className="px-3 py-2 text-center">Available</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {p.product_variants.map(v => (
                                                        <tr key={v.id} className="border-t border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                                                            <td className="px-3 py-2">
                                                                <div className="flex items-center gap-1.5">
                                                                    {v.color_hex && (
                                                                        <span
                                                                            className="inline-block h-3 w-3 rounded-full border border-gray-300 dark:border-gray-600 shrink-0"
                                                                            style={{ backgroundColor: v.color_hex }}
                                                                        />
                                                                    )}
                                                                    <span className="text-gray-700 dark:text-gray-300">{v.color}</span>
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2">
                                                                <span className="px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium">{v.size}</span>
                                                            </td>
                                                            <td className="px-3 py-2 font-mono text-gray-500">{v.sku || '-'}</td>
                                                            <td className="px-3 py-2 text-right font-semibold text-gray-700 dark:text-gray-300">
                                                                {v.price ? `$${v.price}` : '-'}
                                                            </td>
                                                            <td className="px-3 py-2 text-right">
                                                                <span className={cn(
                                                                    "font-semibold",
                                                                    (v.stock_quantity || 0) === 0 ? "text-red-400" :
                                                                        (v.stock_quantity || 0) < 10 ? "text-amber-400" :
                                                                            "text-emerald-400"
                                                                )}>
                                                                    {v.stock_quantity ?? 0}
                                                                </span>
                                                            </td>
                                                            <td className="px-3 py-2 text-center">
                                                                {v.is_available ? (
                                                                    <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
                                                                ) : (
                                                                    <span className="inline-block h-2 w-2 rounded-full bg-red-500" />
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-4 text-xs text-gray-500 bg-gray-50 dark:bg-gray-700/30 rounded-lg">
                                            No variants added yet
                                        </div>
                                    )}
                                </div>

                                <div className="text-xs text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                                    Created: {new Date(p.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                                </div>
                            </div>
                            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-2">
                                <button
                                    onClick={() => {
                                        const prodId = p.id
                                        setViewModal({ open: false, product: null })
                                        navigate(`/products/${prodId}/edit`)
                                    }}
                                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 rounded-lg transition-colors"
                                >
                                    <Edit className="mr-1.5 h-3.5 w-3.5" /> Edit
                                </button>
                                <button
                                    onClick={() => setViewModal({ open: false, product: null })}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                )
            })()}

            {/* ─── Delete Confirmation Modal ─── */}
            {deleteModal.open && deleteModal.product && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteModal({ open: false, product: null })}>
                    <div
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm mx-4 overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-6 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                <Trash className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Product</h3>
                            <p className="text-sm text-gray-500">
                                Are you sure you want to delete <strong className="text-gray-700 dark:text-gray-300">"{deleteModal.product.name}"</strong>? This will also remove all variants and images. This action cannot be undone.
                            </p>
                        </div>
                        <div className="flex border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setDeleteModal({ open: false, product: null })}
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
