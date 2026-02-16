import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { Plus, Edit, Trash, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { cn } from '../lib/utils'

export default function Categories() {
    const [categories, setCategories] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchCategories()
    }, [])

    async function fetchCategories() {
        setLoading(true)
        const { data, error } = await supabase
            .from('categories')
            .select('*')
            .order('display_order', { ascending: true })

        if (error) {
            console.error('Error fetching categories:', error)
        } else {
            setCategories(data || [])
        }
        setLoading(false)
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
                            <th className="px-6 py-3">Status</th>
                            <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">Loading...</td></tr>
                        ) : categories.length === 0 ? (
                            <tr><td colSpan="5" className="px-6 py-10 text-center text-gray-500">No categories found.</td></tr>
                        ) : (
                            categories.map((cat) => (
                                <tr key={cat.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                                    <td className="px-6 py-4">{cat.display_order}</td>
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{cat.name}</td>
                                    <td className="px-6 py-4 text-gray-500">{cat.slug}</td>
                                    <td className="px-6 py-4">
                                        <span className={cn(
                                            "px-2 py-1 rounded-full text-xs font-semibold",
                                            cat.is_active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                                        )}>
                                            {cat.is_active ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-blue-600 hover:text-blue-900 mr-3"><Edit className="h-4 w-4" /></button>
                                        <button className="text-red-600 hover:text-red-900"><Trash className="h-4 w-4" /></button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
