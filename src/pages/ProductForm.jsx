import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save, Upload, X, Plus, Trash2, Box, Palette, Ruler, Hash, DollarSign, Package } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { cn } from '../lib/utils'

// ─── Add Product Type Modal ───
function AddProductTypeModal({ open, onClose, onCreated }) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [saving, setSaving] = useState(false)

    if (!open) return null

    async function handleSave() {
        if (!name.trim()) return
        setSaving(true)
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        const { data, error } = await supabase
            .from('product_types')
            .insert([{ name: name.trim(), slug, description: description.trim() || null }])
            .select()
            .single()

        if (error) {
            alert('Error creating product type: ' + error.message)
        } else {
            onCreated(data)
            setName('')
            setDescription('')
            onClose()
        }
        setSaving(false)
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 w-full max-w-md mx-4 overflow-hidden" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500/5 to-indigo-500/5">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">New Product Type</h2>
                    <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>
                <div className="p-5 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type Name *</label>
                        <input
                            type="text" value={name} onChange={e => setName(e.target.value)} autoFocus
                            placeholder="e.g. T-Shirt, Jeans, Sneakers..."
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                        <input
                            type="text" value={description} onChange={e => setDescription(e.target.value)}
                            placeholder="Optional description"
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                        Cancel
                    </button>
                    <button onClick={handleSave} disabled={saving || !name.trim()}
                        className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                        {saving ? 'Creating...' : 'Create Type'}
                    </button>
                </div>
            </div>
        </div>
    )
}

// ─── Variant Row Component ───
function VariantRow({ variant, index, onChange, onRemove }) {
    function update(field, value) {
        onChange(index, { ...variant, [field]: value })
    }

    return (
        <div className="grid grid-cols-12 gap-2 items-start p-3 rounded-lg bg-gray-50 dark:bg-gray-700/30 border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 transition-colors group">
            {/* Color */}
            <div className="col-span-3 sm:col-span-2">
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Color *</label>
                <div className="flex items-center gap-1">
                    <input
                        type="text"
                        value={variant.color}
                        onChange={e => {
                            const val = e.target.value;
                            // Auto-normalize: "blue" -> "Blue" while typing looks weird, so we capitalize 
                            // but let user type. Normalization happens better onBlur or via suggestions.
                            update('color', val);
                        }}
                        onBlur={e => {
                            const val = e.target.value.trim();
                            if (val) {
                                const normalized = val.charAt(0).toUpperCase() + val.slice(1).toLowerCase();
                                update('color', normalized);
                            }
                        }}
                        list="existing-colors"
                        required
                        placeholder="Blue" className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                    />
                </div>
            </div>
            {/* Color Hex */}
            <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Hex</label>
                <div className="flex items-center gap-1">
                    <input
                        type="color" value={variant.color_hex || '#000000'} onChange={e => update('color_hex', e.target.value)}
                        className="h-[30px] w-full rounded border border-gray-300 cursor-pointer dark:border-gray-700"
                    />
                </div>
            </div>
            {/* Size */}
            <div className="col-span-2 sm:col-span-1">
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Size *</label>
                <input
                    type="text" value={variant.size} onChange={e => update('size', e.target.value)} required
                    placeholder="M" className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                />
            </div>
            {/* SKU */}
            <div className="col-span-5 sm:col-span-2">
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">SKU</label>
                <input
                    type="text" value={variant.sku || ''} onChange={e => update('sku', e.target.value)}
                    placeholder="TSH-BLU-M" className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs font-mono focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                />
            </div>
            {/* Price */}
            <div className="col-span-3 sm:col-span-2">
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Price</label>
                <input
                    type="number" step="0.01" value={variant.price || ''} onChange={e => update('price', e.target.value)}
                    placeholder="0.00" className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                />
            </div>
            {/* Stock */}
            <div className="col-span-3 sm:col-span-2">
                <label className="block text-[10px] text-gray-500 uppercase tracking-wider mb-1">Stock</label>
                <input
                    type="number" min="0" value={variant.stock_quantity ?? ''} onChange={e => update('stock_quantity', e.target.value)}
                    placeholder="0" className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                />
            </div>
            {/* Available + Remove */}
            <div className="col-span-6 sm:col-span-2 flex items-end gap-2 pb-0.5">
                <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                        type="checkbox" checked={variant.is_available ?? true} onChange={e => update('is_available', e.target.checked)}
                        className="h-3.5 w-3.5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] text-gray-500">Available</span>
                </label>
                <button
                    type="button" onClick={() => onRemove(index)}
                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all ml-auto"
                    title="Remove variant"
                >
                    <Trash2 className="h-3.5 w-3.5" />
                </button>
            </div>
        </div>
    )
}

// ─── Main ProductForm ───
export default function ProductForm() {
    const navigate = useNavigate()
    const { id } = useParams()
    const isEditMode = Boolean(id)

    const [categories, setCategories] = useState([])
    const [types, setTypes] = useState([])
    const [loading, setLoading] = useState(false)
    const [fetching, setFetching] = useState(false)
    const [images, setImages] = useState([])
    const [previewUrls, setPreviewUrls] = useState([])
    const [existingImages, setExistingImages] = useState([])
    const [showTypeModal, setShowTypeModal] = useState(false)

    // Variants state
    const [variants, setVariants] = useState([])
    const [existingVariantIds, setExistingVariantIds] = useState([]) // track IDs already in DB

    const [formData, setFormData] = useState({
        name: '',
        slug: '',
        description: '',
        category_id: '',
        product_type_id: '',
        base_price: '',
        compare_at_price: '',
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

    // Fetch product data for edit mode
    useEffect(() => {
        if (!isEditMode) return
        async function fetchProduct() {
            setFetching(true)
            const { data, error } = await supabase
                .from('products')
                .select('*, product_images(*), product_variants(*)')
                .eq('id', id)
                .single()

            if (error || !data) {
                alert('Product not found')
                navigate('/products')
                return
            }

            setFormData({
                name: data.name || '',
                slug: data.slug || '',
                description: data.description || '',
                category_id: data.category_id || '',
                product_type_id: data.product_type_id || '',
                base_price: data.base_price?.toString() || '',
                compare_at_price: data.compare_at_price?.toString() || '',
                status: data.status || 'active',
                featured: data.featured || false
            })

            if (data.product_images) {
                setExistingImages(data.product_images.sort((a, b) => a.display_order - b.display_order))
            }
            if (data.product_variants) {
                setVariants(data.product_variants.map(v => ({
                    ...v,
                    price: v.price?.toString() || '',
                    stock_quantity: v.stock_quantity?.toString() ?? '0',
                })))
                setExistingVariantIds(data.product_variants.map(v => v.id))
            }
            setFetching(false)
        }
        fetchProduct()
    }, [id, isEditMode, navigate])

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
            URL.revokeObjectURL(prev[index])
            return newPreviews
        })
    }

    async function removeExistingImage(imageId) {
        const { error } = await supabase.from('product_images').delete().eq('id', imageId)
        if (!error) {
            setExistingImages(prev => prev.filter(img => img.id !== imageId))
        }
    }

    // ─── Variant Handlers ───
    function addVariant() {
        setVariants(prev => [...prev, {
            color: '', color_hex: '#000000', size: '', sku: '', price: '', stock_quantity: '0', is_available: true
        }])
    }

    function updateVariant(index, updatedVariant) {
        setVariants(prev => prev.map((v, i) => i === index ? updatedVariant : v))
    }

    function removeVariant(index) {
        setVariants(prev => prev.filter((_, i) => i !== index))
    }

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)

        try {
            const productPayload = {
                name: formData.name,
                slug: formData.slug,
                description: formData.description,
                category_id: formData.category_id,
                product_type_id: formData.product_type_id,
                base_price: parseFloat(formData.base_price),
                compare_at_price: formData.compare_at_price ? parseFloat(formData.compare_at_price) : null,
                status: formData.status,
                featured: formData.featured
            }

            let productId

            if (isEditMode) {
                const { error } = await supabase.from('products').update(productPayload).eq('id', id)
                if (error) throw error
                productId = id
            } else {
                const { data: product, error } = await supabase.from('products').insert([productPayload]).select().single()
                if (error) throw error
                productId = product.id
            }

            // ─── Save Variants ───
            if (isEditMode) {
                // Delete removed variants (ones in existingVariantIds that are no longer in variants)
                const currentIds = variants.filter(v => v.id).map(v => v.id)
                const deletedIds = existingVariantIds.filter(id => !currentIds.includes(id))
                if (deletedIds.length > 0) {
                    await supabase.from('product_variants').delete().in('id', deletedIds)
                }
            }

            for (const v of variants) {
                const variantPayload = {
                    product_id: productId,
                    color: v.color,
                    color_hex: v.color_hex || null,
                    size: v.size,
                    sku: v.sku || null,
                    price: v.price ? parseFloat(v.price) : null,
                    stock_quantity: parseInt(v.stock_quantity) || 0,
                    is_available: v.is_available ?? true,
                }

                if (v.id && existingVariantIds.includes(v.id)) {
                    // Update existing variant
                    await supabase.from('product_variants').update(variantPayload).eq('id', v.id)
                } else {
                    // Insert new variant
                    await supabase.from('product_variants').insert([variantPayload])
                }
            }

            // ─── Upload Images ───
            if (images.length > 0) {
                const startOrder = existingImages.length
                for (let i = 0; i < images.length; i++) {
                    const file = images[i]
                    const fileExt = file.name.split('.').pop()
                    const fileName = `${productId}/${Date.now()}_${i}.${fileExt}`

                    console.log(`Attempting to upload: ${fileName}`)
                    const { error: uploadError } = await supabase.storage.from('product-images').upload(fileName, file)

                    if (uploadError) {
                        console.error('Error uploading image :', uploadError)
                        throw new Error(`Failed to upload image ${file.name}: ${uploadError.message}`)
                    }

                    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(fileName)

                    const { error: insertError } = await supabase.from('product_images').insert({
                        product_id: productId,
                        image_url: publicUrl,
                        is_primary: existingImages.length === 0 && i === 0,
                        display_order: startOrder + i
                    })

                    if (insertError) {
                        console.error('Error linking image:', insertError)
                        throw new Error(`Failed to link image ${file.name}: ${insertError.message}`)
                    }
                }
            }

            navigate('/products')
        } catch (error) {
            alert('Error saving product: ' + error.message)
        } finally {
            setLoading(false)
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
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/products" className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                        {isEditMode ? 'Edit Product' : 'Add New Product'}
                    </h1>
                </div>
                <button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="inline-flex items-center justify-center rounded-md bg-green-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-green-700 disabled:opacity-50"
                >
                    <Save className="mr-2 h-4 w-4" />
                    {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Save Product'}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* ─── Basic Information ─── */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="text-lg font-medium">Basic Information</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name</label>
                            <input type="text" required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.name} onChange={handleNameChange}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug</label>
                            <input type="text" required
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.slug} onChange={e => setFormData({ ...formData, slug: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea rows={4}
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* ─── Media ─── */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="text-lg font-medium">Media</h2>

                        {existingImages.length > 0 && (
                            <div className="grid grid-cols-4 gap-4">
                                {existingImages.map(img => (
                                    <div key={img.id} className="relative aspect-square rounded-md overflow-hidden bg-gray-100 border-2 border-gray-200 dark:border-gray-700">
                                        <img src={img.image_url} alt={img.alt_text || 'Product'} className="object-cover w-full h-full" />
                                        {img.is_primary && <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-blue-600 text-white text-[10px] rounded font-medium">Primary</span>}
                                        <button type="button" onClick={() => removeExistingImage(img.id)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors relative">
                            <input type="file" multiple accept="image/*" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={handleImageChange} />
                            <Upload className="h-8 w-8 text-gray-400 mb-2" />
                            <p className="text-sm text-gray-500">Click or drag images here to upload</p>
                        </div>

                        {previewUrls.length > 0 && (
                            <div className="grid grid-cols-4 gap-4 mt-4">
                                {previewUrls.map((url, index) => (
                                    <div key={index} className="relative aspect-square rounded-md overflow-hidden bg-gray-100">
                                        <img src={url} alt="Preview" className="object-cover w-full h-full" />
                                        <button type="button" onClick={() => removeImage(index)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full hover:bg-red-600">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ─── Pricing ─── */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="text-lg font-medium">Pricing</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Base Price</label>
                                <input type="number" step="0.01" required
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    value={formData.base_price} onChange={e => setFormData({ ...formData, base_price: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Compare at Price</label>
                                <input type="number" step="0.01"
                                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    value={formData.compare_at_price} onChange={e => setFormData({ ...formData, compare_at_price: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ═══════════════════════════════════════════════ */}
                    {/* ─── Product Variants Section ─── */}
                    {/* ═══════════════════════════════════════════════ */}
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Box className="h-5 w-5 text-purple-500" />
                                <h2 className="text-lg font-medium">Product Variants</h2>
                                {variants.length > 0 && (
                                    <span className="px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold">
                                        {variants.length}
                                    </span>
                                )}
                            </div>
                            <button
                                type="button"
                                onClick={addVariant}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
                            >
                                <Plus className="h-3.5 w-3.5" />
                                Add Variant
                            </button>
                        </div>

                        {variants.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
                                <Box className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                                <p className="text-sm text-gray-500 mb-1">No variants yet</p>
                                <p className="text-xs text-gray-400 mb-4">Add size, color, and stock variations for this product</p>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/40 rounded-lg transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    Add First Variant
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Header labels */}
                                <div className="hidden sm:grid grid-cols-12 gap-2 px-3 text-[10px] text-gray-500 uppercase tracking-wider font-semibold">
                                    <div className="col-span-2">Color</div>
                                    <div className="col-span-1">Hex</div>
                                    <div className="col-span-1">Size</div>
                                    <div className="col-span-2">SKU</div>
                                    <div className="col-span-2">Price</div>
                                    <div className="col-span-2">Stock</div>
                                    <div className="col-span-2"></div>
                                </div>
                                {variants.map((v, idx) => (
                                    <VariantRow key={v.id || `new-${idx}`} variant={v} index={idx} onChange={updateVariant} onRemove={removeVariant} />
                                ))}
                            </div>
                        )}

                        {variants.length > 0 && (
                            <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500">
                                <span>
                                    Total stock: <strong className="text-emerald-500">{variants.reduce((s, v) => s + (parseInt(v.stock_quantity) || 0), 0)}</strong>
                                </span>
                                <button
                                    type="button"
                                    onClick={addVariant}
                                    className="inline-flex items-center gap-1 text-purple-500 hover:text-purple-400 font-medium transition-colors"
                                >
                                    <Plus className="h-3 w-3" /> Add another
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* ─── Sidebar ─── */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 space-y-4">
                        <h2 className="text-lg font-medium">Organization</h2>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                            <select
                                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value })}
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
                                value={formData.category_id} onChange={e => setFormData({ ...formData, category_id: e.target.value })} required
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Type</label>
                            <div className="flex gap-2">
                                <select
                                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-900 dark:border-gray-700"
                                    value={formData.product_type_id} onChange={e => setFormData({ ...formData, product_type_id: e.target.value })} required
                                >
                                    <option value="">Select Type</option>
                                    {types.map(type => (
                                        <option key={type.id} value={type.id}>{type.name}</option>
                                    ))}
                                </select>
                                <button
                                    type="button"
                                    onClick={() => setShowTypeModal(true)}
                                    className="shrink-0 p-2 rounded-md border border-gray-300 dark:border-gray-700 text-gray-500 hover:text-blue-500 hover:border-blue-500 hover:bg-blue-500/5 transition-all"
                                    title="Add new product type"
                                >
                                    <Plus className="h-4 w-4" />
                                </button>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <input type="checkbox" id="featured"
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                checked={formData.featured} onChange={e => setFormData({ ...formData, featured: e.target.checked })}
                            />
                            <label htmlFor="featured" className="text-sm font-medium text-gray-700 dark:text-gray-300">⭐ Featured Product</label>
                        </div>
                    </div>
                </div>
            </div>

            {/* Product Type Modal */}
            <AddProductTypeModal
                open={showTypeModal}
                onClose={() => setShowTypeModal(false)}
                onCreated={(newType) => {
                    setTypes(prev => [...prev, newType])
                    setFormData(prev => ({ ...prev, product_type_id: newType.id }))
                }}
            />

            {/* Color Suggestions Datalist */}
            <datalist id="existing-colors">
                {[...new Set(variants.map(v => v.color).filter(Boolean))].map(c => (
                    <option key={c} value={c} />
                ))}
            </datalist>
        </div>
    )
}
