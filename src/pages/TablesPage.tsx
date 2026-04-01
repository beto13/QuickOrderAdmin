import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getTables, createTable, updateTable, deleteTable } from '../api/tables'
import { getMenus } from '../api/menus'
import type { TableDto } from '../types'

export default function TablesPage() {
  const qc = useQueryClient()
  const [modal, setModal] = useState<'create' | 'edit' | null>(null)
  const [selected, setSelected] = useState<TableDto | null>(null)
  const [form, setForm] = useState({ number: '', menuId: '', isActive: true })

  const { data, isLoading } = useQuery({ queryKey: ['tables'], queryFn: () => getTables() })
  const { data: menus } = useQuery({ queryKey: ['menus'], queryFn: () => getMenus() })

  const menuList = menus?.items ?? []
  const invalidate = () => qc.invalidateQueries({ queryKey: ['tables'] })

  const createMut = useMutation({
    mutationFn: () => createTable(form.number, Number(form.menuId)),
    onSuccess: () => { invalidate(); closeModal() },
  })

  const updateMut = useMutation({
    mutationFn: () => updateTable(selected!.id, form.number, form.isActive, Number(form.menuId)),
    onSuccess: () => { invalidate(); closeModal() },
  })

  const deleteMut = useMutation({
    mutationFn: (id: number) => deleteTable(id),
    onSuccess: invalidate,
  })

  const openCreate = () => {
    setForm({ number: '', menuId: String(menuList[0]?.id ?? ''), isActive: true })
    setModal('create')
  }

  const openEdit = (t: TableDto) => {
    setSelected(t)
    setForm({ number: t.number, menuId: String(t.menuId), isActive: t.isActive })
    setModal('edit')
  }

  const closeModal = () => { setModal(null); setSelected(null) }

  const menuName = (menuId: number) => menuList.find(m => m.id === menuId)?.name ?? `#${menuId}`

  const tables = data?.items ?? []
  const active = tables.filter(t => t.isActive)
  const inactive = tables.filter(t => !t.isActive)

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Mesas</h1>
          <p className="text-sm text-gray-500 mt-0.5">{active.length} activas · {inactive.length} inactivas</p>
        </div>
        <button
          onClick={openCreate}
          className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
        >
          + Nueva mesa
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-gray-400 text-sm py-12">Cargando...</div>
      ) : (
        <div className="space-y-6">
          {/* Activas */}
          {active.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Activas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {active.map(table => (
                  <TableCard key={table.id} table={table} menuName={menuName(table.menuId)} onEdit={openEdit} onDelete={id => deleteMut.mutate(id)} />
                ))}
              </div>
            </section>
          )}

          {/* Inactivas */}
          {inactive.length > 0 && (
            <section>
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">Inactivas</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {inactive.map(table => (
                  <TableCard key={table.id} table={table} menuName={menuName(table.menuId)} onEdit={openEdit} onDelete={id => deleteMut.mutate(id)} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6">
            <h2 className="font-bold text-gray-900 mb-4">{modal === 'create' ? 'Nueva mesa' : 'Editar mesa'}</h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Número / Nombre</label>
                <input
                  value={form.number}
                  onChange={e => setForm(f => ({ ...f, number: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Ej: 1, A1, Terraza 2"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Menú asignado</label>
                <select
                  value={form.menuId}
                  onChange={e => setForm(f => ({ ...f, menuId: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400 bg-white"
                >
                  {menuList.map(m => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              </div>

              {modal === 'edit' && (
                <label className="flex items-center gap-3 cursor-pointer" onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}>
                  <div className={`w-10 h-6 rounded-full transition-colors ${form.isActive ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 bg-white rounded-full shadow mt-1 transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-1'}`} />
                  </div>
                  <span className="text-sm text-gray-700">Activa</span>
                </label>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={closeModal} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
              <button
                onClick={() => modal === 'create' ? createMut.mutate() : updateMut.mutate()}
                disabled={!form.number || !form.menuId || createMut.isPending || updateMut.isPending}
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

function TableCard({ table, menuName, onEdit, onDelete }: {
  table: TableDto
  menuName: string
  onEdit: (t: TableDto) => void
  onDelete: (id: number) => void
}) {
  return (
    <div className={`bg-white rounded-xl border p-4 flex flex-col gap-3 ${table.isActive ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold text-gray-900">{table.number}</span>
        <span className={`w-2 h-2 rounded-full ${table.isActive ? 'bg-green-400' : 'bg-gray-300'}`} />
      </div>
      <span className="text-xs text-gray-400">{menuName}</span>
      <div className="flex gap-1 pt-1 border-t border-gray-100">
        <button onClick={() => onEdit(table)} className="flex-1 text-xs text-gray-500 hover:text-gray-900 py-1 rounded hover:bg-gray-50 transition-colors">Editar</button>
        <button onClick={() => onDelete(table.id)} className="flex-1 text-xs text-red-400 hover:text-red-600 py-1 rounded hover:bg-red-50 transition-colors">Eliminar</button>
      </div>
    </div>
  )
}
