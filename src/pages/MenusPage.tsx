import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getMenus, createMenu, updateMenu, deleteMenu } from '../api/menus'
import type { MenuDto } from '../types'

export default function MenusPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<MenuDto | null>(null)
  const [form, setForm] = useState({ name: '', isActive: true })

  const { data, isLoading } = useQuery({
    queryKey: ['menus'],
    queryFn: () => getMenus(),
  })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['menus'] })

  const createMut = useMutation({
    mutationFn: () => createMenu(form.name),
    onSuccess: () => { invalidate(); closeModal() },
  })

  const updateMut = useMutation({
    mutationFn: () => updateMenu(selected!.id, form.name, form.isActive),
    onSuccess: () => { invalidate(); closeModal() },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteMenu(id),
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setForm({ name: '', isActive: true })
    setModal('create')
  }

  const openEdit = (m: MenuDto) => {
    setSelected(m)
    setForm({ name: m.name, isActive: m.isActive })
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setSelected(null) }

  const menus = data?.items ?? []

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Menús</h1>
          <p className="text-sm text-gray-500 mt-0.5">Gestioná los menús del bar</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Nuevo menú
        </button>
      </div>

      {/* Cards */}
      {isLoading ? (
        <div className="text-center text-gray-400 text-sm py-12">Cargando...</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {menus.map(menu => (
            <div key={menu.id} className="bg-white rounded-xl border border-gray-200 p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{menu.name}</h2>
                  <span className={`inline-flex items-center gap-1 text-xs font-medium mt-1 ${menu.isActive ? 'text-green-600' : 'text-gray-400'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${menu.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                    {menu.isActive ? 'Activo' : 'Inactivo'}
                  </span>
                </div>
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">#{menu.id}</span>
              </div>

              <div className="flex gap-2 mt-auto pt-2 border-t border-gray-100">
                <button
                  onClick={() => openEdit(menu)}
                  className="flex-1 text-xs font-medium text-gray-600 hover:text-gray-900 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Editar
                </button>
                <button
                  onClick={() => deleteMut.mutate(menu.id)}
                  className="flex-1 text-xs font-medium text-red-400 hover:text-red-600 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">{modal === 'create' ? 'Nuevo menú' : 'Editar menú'}</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</label>
                <input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Ej: Salón, Terraza"
                />
              </div>
              {modal === 'edit' && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                    className={`w-10 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow mt-1 transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-sm text-gray-700">Activo</span>
                </label>
              )}
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
