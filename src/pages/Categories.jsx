import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit, Trash, X } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { cn } from '../lib/utils'

export default function Categories() {
    const navigate = useNavigate()
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)
    const [deleteModal, setDeleteModal] = useState({ open: false, category: null })
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchCategories()
    }, [])

    async function fetchCategories() {
        setLoading(true)
        const { data, error } = await supabase
            .from('categories')
            .select('*, products(id)')
            .order('display_order', { ascending: true })

        if (error) {
            console.error('Error fetching categories:', error)
        } else {
            setCategories(data || [])
        }
        setLoading(false)
    }

    async function handleDelete() {
        if (!deleteModal.category) return
        setDeleting(true)
        try {
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', deleteModal.category.id)

            if (error) throw error
            setCategories(prev => prev.filter(c => c.id !== deleteModal.category.id))
            setDeleteModal({ open: false, category: null })
        } catch (error) {
            alert('Error deleting category: ' + error.message)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Categories</h1>
                    <p className="text-sm text-gray-500">Manage product categories</p>
                </div>
                <Link
                    to="/categories/new"
                    className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700"
                >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Category
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm text-left">
                    <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                        <tr>
                            <th className="px-6 py-3">Order</th>
                            <th className="px-6 py-3">Name</th>
                            <th className="px-6 py-3">Slug</th>
                            <th className="px-6 py-3">Products</th>
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">Loading...</td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-10 text-center text-gray-500">No categories found.</td></tr>
                        ) : (
                            categories.map((cat) => (
                                <tr key={cat.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-6 py-4 text-gray-500">{cat.display_order}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                                        {cat.image_url && (
                                            <img src={cat.image_url} alt={cat.name} className="inline-block h-6 w-6 rounded mr-2 object-cover" />
                                        )}
                                        {cat.name}
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{cat.slug}</td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-xs font-semibold">
                                            {cat.products?.length || 0}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-semibold",
                                            cat.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                        )}>
                                            {cat.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end space-x-1">
                                            <button
                                                onClick={() => navigate(`/categories/${cat.id}/edit`)}
                                                className="p-1.5 text-gray-500 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-all duration-200"
                                                title="Edit category"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteModal({ open: true, category: cat })}
                                                className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                                title="Delete category"
                                            >
                                                <Trash className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* ─── Delete Confirmation Modal ─── */}
            {deleteModal.open && deleteModal.category && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => !deleting && setDeleteModal({ open: false, category: null })}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-sm mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-6 text-center">
                            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                <Trash className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Delete Category</h3>
                            <p className="text-sm text-gray-500">
                                Are you sure you want to delete <strong className="text-gray-700 dark:text-gray-300">"{deleteModal.category.name}"</strong>?
                                {(deleteModal.category.products?.length || 0) > 0 && (
                                    <span className="block mt-1 text-red-500 font-medium">
                                        ⚠️ This category has {deleteModal.category.products.length} product(s). You must reassign them first.
                                    </span>
                                )}
                            </p>
                        </div>
                        <div className="flex border-t border-gray-200 dark:border-gray-700">
                            <button
                                onClick={() => setDeleteModal({ open: false, category: null })}
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
