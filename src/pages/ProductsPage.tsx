import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getProducts, createProduct, updateProduct, deleteProduct, uploadProductImage } from '../api/products'
import ProductModifiersModal from '../components/ProductModifiersModal'
import type { ProductDto } from '../types'

export default function ProductsPage() {
  const qc = useQueryClient()
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<ProductDto | null>(null)
  const [modifiersProduct, setModifiersProduct] = useState<ProductDto | null>(null)
  const [form, setForm] = useState({ name: '', description: '' })
  const [imageFile, setImageFile] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const modalFileRef = useRef<HTMLInputElement>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['products', page],
    queryFn: () => getProducts(page),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['products'] })

  const createMut = useMutation({
    mutationFn: async () => {
      const product = await createProduct(form.name, form.description || null)
      if (imageFile) await uploadProductImage(product.id, imageFile)
    },
    onSuccess: () => { invalidate(); closeModal() },
  })

  const updateMut = useMutation({
    mutationFn: async () => {
      await updateProduct(selected!.id, form.name, form.description || null)
      if (imageFile) await uploadProductImage(selected!.id, imageFile)
    },
    onSuccess: () => { invalidate(); closeModal() },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteProduct(id),
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setForm({ name: '', description: '' })
    setImageFile(null)
    setImagePreview(null)
    setModal('create')
  }

  const openEdit = (p: ProductDto) => {
    setSelected(p)
    setForm({ name: p.name, description: p.description ?? '' })
    setImageFile(null)
    setImagePreview(p.imageUrl ?? null)
    setModal('edit')
  }

  const closeModal = () => {
    setModal(null)
    setSelected(null)
    setImageFile(null)
    setImagePreview(null)
  }

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setImagePreview(URL.createObjectURL(file))
    e.target.value = ''
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Productos</h1>
          <p className="text-sm text-gray-500 mt-0.5">Catálogo maestro de productos</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Nuevo producto
        </button>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Imagen</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.items.map(product => (
                <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-300">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                  <td className="px-4 py-3 text-gray-500">{product.description ?? <span className="text-gray-300">—</span>}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setModifiersProduct(product)}
                        className="text-xs text-blue-500 hover:text-blue-700 font-medium px-2 py-1 rounded hover:bg-blue-50 transition-colors"
                      >
                        Modificadores
                      </button>
                      <button
                        onClick={() => openEdit(product)}
                        className="text-xs text-gray-500 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => deleteMut.mutate(product.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
          <span>{data.totalCount} productos</span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Anterior</button>
            <span className="px-3 py-1">{page} / {data.totalPages}</span>
            <button disabled={page === data.totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">Siguiente</button>
          </div>
        </div>
      )}

      {/* Modal modificadores */}
      {modifiersProduct && (
        <ProductModifiersModal
          product={modifiersProduct}
          onClose={() => setModifiersProduct(null)}
        />
      )}

      {/* Modal crear/editar */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h2 className="font-bold text-gray-900 mb-4">{modal === 'create' ? 'Nuevo producto' : 'Editar producto'}</h2>

            <div className="space-y-4">
              {/* Imagen */}
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Imagen</label>
                <button
                  type="button"
                  onClick={() => modalFileRef.current?.click()}
                  className="mt-1 w-full h-36 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-400 transition-colors overflow-hidden flex items-center justify-center"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400">
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="text-xs">Seleccionar imagen</span>
                    </div>
                  )}
                </button>
                <input ref={modalFileRef} type="file" accept="image/*" className="hidden" onChange={handleImageSelect} />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Ej: Lomito clásico"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción</label>
                <textarea
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 resize-none"
                  rows={3}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
              <button
                onClick={() => modal === 'create' ? createMut.mutate() : updateMut.mutate()}
                disabled={!form.name || createMut.isPending || updateMut.isPending}
                className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {createMut.isPending || updateMut.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
