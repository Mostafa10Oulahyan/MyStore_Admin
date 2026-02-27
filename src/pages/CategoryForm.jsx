import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function CategoryForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditMode = Boolean(id)

    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        is_active: true,
        display_order: 0
    })

    // Fetch category for edit mode
    useEffect(() => {
        if (!isEditMode) return
        async function fetchCategory() {
            setFetching(true)
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('id', id)
                .single()

            if (error || !data) {
                alert('Category not found')
                navigate('/categories')
                return
            }

            setFormData({
                name: data.name || '',
                slug: data.slug || '',
                description: data.description || '',
                is_active: data.is_active ?? true,
                display_order: data.display_order ?? 0
            })
            setFetching(false)
        }
        fetchCategory()
    }, [id, isEditMode, navigate])

    function handleNameChange(e) {
        const name = e.target.value
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        setFormData(prev => ({ ...prev, name, slug }))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        let error
        if (isEditMode) {
            ({ error } = await supabase.from('categories').update(formData).eq('id', id))
        } else {
            ({ error } = await supabase.from('categories').insert([formData]))
        }

        setLoading(false)
        if (error) {
            alert(`Error ${isEditMode ? 'updating' : 'creating'} category: ` + error.message)
        } else {
            navigate('/categories')
        }
    }

    if (fetching) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <div className="flex items-center gap-4">
                <Link to="/categories" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                    {isEditMode ? 'Edit Category' : 'Add Category'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                    <input
                        type="text" required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                        value={formData.name} onChange={handleNameChange}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
                    <input
                        type="text" required
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                        value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                    <textarea
                        rows={3}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                        value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                    />
                </div>
                <div className="flex gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Display Order</label>
                        <input
                            type="number"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                            value={formData.display_order} onChange={e => setFormData({ ...formData, display_order: parseInt(e.target.value) || 0 })}
                        />
                    </div>
                    <div className="flex items-center pt-6">
                        <input
                            type="checkbox" id="is_active"
                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })}
                        />
                        <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                            Active
                        </label>
                    </div>
                </div>

                <div className="pt-4">
                    <button
                        type="submit" disabled={loading}
                        className="w-full inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50"
                    >
                        <Save className="mr-2 h-4 w-4" />
                        {loading ? 'Saving...' : isEditMode ? 'Update Category' : 'Save Category'}
                    </button>
                </div>
            </form>
        </div>
    )
}
