import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Save, Upload, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

export default function ProductForm() {
    const navigate = useNavigate()
    const [categories, setCategories] = useState([])
    const [types, setTypes] = useState([])
    const [loading, setLoading] = useState(false)
    const [images, setImages] = useState([]) // Array of files
    const [previewUrls, setPreviewUrls] = useState([])

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        category_id: '',
        product_type_id: '',
        base_price: '',
        compare_at_price: '',
        sku: '',
        status: 'active',
        featured: false
    })

    useEffect(() => {
        async function fetchData() {
            const [cats, typs] = await Promise.all([
                supabase.from('categories').select('*').eq('is_active', true),
                supabase.from('product_types').select('*')
            ])
            if (cats.data) setCategories(cats.data)
            if (typs.data) setTypes(typs.data)
        }
        fetchData()
    }, [])

    function handleNameChange(e) {
        const name = e.target.value
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        setFormData(prev => ({ ...prev, name, slug }))
    }

    function handleImageChange(e) {
        if (e.target.files) {
            const files = Array.from(e.target.files)
            setImages(prev => [...prev, ...files])

            const newPreviews = files.map(file => URL.createObjectURL(file))
            setPreviewUrls(prev => [...prev, ...newPreviews])
        }
    }

    function removeImage(index) {
        setImages(prev => prev.filter((_, i) => i !== index))
        setPreviewUrls(prev => {
            const newPreviews = prev.filter((_, i) => i !== index)
            URL.revokeObjectURL(prev[index]) // Cleanup
            return newPreviews
        })
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        try {
            // 1. Insert product
            const { data: product, error } = await supabase
                .from('products')
                .insert([{
                    ...formData,
                    base_price: parseFloat(formData.base_price),
                    compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null
                }])
                .select()
                .single()

            if (error) throw error

            // 2. Upload images
            if (images.length > 0) {
                for (let i = 0; i < images.length; i++) {
                    const file = images[i]
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${product.id}/${Date.now()}_${i}.${fileExt}`

                    const { error: uploadError } = await supabase.storage
                        .from('product-images')
                        .upload(fileName, file)

                    if (uploadError) {
                        console.error('Error uploading image:', uploadError)
                        continue
                    }

                    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)

                    await supabase.from('product_images').insert({
                        product_id: product.id,
                        image_url: publicUrl,
                        is_primary: i === 0, // First image is primary
                        display_order: i
                    })
                }
            }

            navigate('/products')
        } catch (error) {
            alert('Error creating product: ' + error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/products" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Add New Product</h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700 disabled:opacity-50"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Product'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="text-lg font-medium">Basic Information</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.name}
                                onChange={handleNameChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.slug}
                                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                rows={4}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="text-lg font-medium">Media</h2>

                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative">
                            <input
                                type="file"
                                multiple
                                accept="image/*"
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={handleImageChange}
                            />
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Click or drag images here to upload</p>
                        </div>

                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-4 gap-4 mt-4">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                                        <img src={url} alt="Preview" className="object-cover w-full h-full" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(index)}
                                            className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="text-lg font-medium">Pricing</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    value={formData.base_price}
                                    onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Compare at Price</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    value={formData.compare_at_price}
                                    onChange={(e) => setFormData({ ...formData, compare_at_price: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Info */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="text-lg font-medium">Organization</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.status}
                                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            >
                                <option value="active">Active</option>
                                <option value="draft">Draft</option>
                                <option value="archived">Archived</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.category_id}
                                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                                required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Type</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.product_type_id}
                                onChange={(e) => setFormData({ ...formData, product_type_id: e.target.value })}
                                required
                            >
                                <option value="">Select Type</option>
                                {types.map(type => (
                                    <option key={type.id} value={type.id}>{type.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="text-lg font-medium">Inventory</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                            <input
                                type="text"
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.sku}
                                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
