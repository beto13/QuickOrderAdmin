import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import client from '../api/client'
import type { ApiResponse, PaginatedResponse, CategoryDto } from '../types'

async function getCategories() {
  const res = await client.get<ApiResponse<PaginatedResponse<CategoryDto>>>('/categories?pageSize=50')
  return res.data.data
}
async function createCategory(name: string, displayOrder: number) {
  const res = await client.post<ApiResponse<CategoryDto>>('/categories', { name, displayOrder })
  return res.data.data
}
async function updateCategory(id: number, name: string, displayOrder: number) {
  const res = await client.put<ApiResponse<CategoryDto>>(`/categories/${id}`, { name, displayOrder })
  return res.data.data
}
async function deleteCategory(id: number) {
  await client.delete(`/categories/${id}`)
}

export default function CategoriesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<CategoryDto | null>(null)
  const [form, setForm] = useState({ name: '', displayOrder: '0' })

  const { data, isLoading } = useQuery({ queryKey: ['categories'], queryFn: getCategories })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['categories'] })

  const createMut = useMutation({
    mutationFn: () => createCategory(form.name, Number(form.displayOrder)),
    onSuccess: () => { invalidate(); closeModal() },
  })

  const updateMut = useMutation({
    mutationFn: () => updateCategory(selected!.id, form.name, Number(form.displayOrder)),
    onSuccess: () => { invalidate(); closeModal() },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteCategory(id),
    onSuccess: invalidate,
  })

  const openCreate = () => { setForm({ name: '', displayOrder: '0' }); setModal('create') }
  const openEdit = (c: CategoryDto) => { setSelected(c); setForm({ name: c.name, displayOrder: String(c.displayOrder) }); setModal('edit') }
  const closeModal = () => { setModal(null); setSelected(null) }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Categorías</h1>
          <p className="text-sm text-gray-500 mt-0.5">Organizá los productos por sección</p>
        </div>
        <button onClick={openCreate} className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors">
          + Nueva categoría
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-gray-400 text-sm">Cargando...</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50">
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Orden</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data?.items.map(cat => (
                <tr key={cat.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{cat.name}</td>
                  <td className="px-4 py-3 text-gray-500">{cat.displayOrder}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => openEdit(cat)} className="text-xs text-gray-500 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-100 transition-colors">Editar</button>
                      <button onClick={() => deleteMut.mutate(cat.id)} className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">{modal === 'create' ? 'Nueva categoría' : 'Editar categoría'}</h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" placeholder="Ej: Bebidas, Sándwiches" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Orden de visualización</label>
                <input type="number" value={form.displayOrder} onChange={e => setForm(f => ({ ...f, displayOrder: e.target.value }))} className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400" />
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
