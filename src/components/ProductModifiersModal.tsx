import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getModifierGroups,
  createModifierGroup,
  updateModifierGroup,
  deleteModifierGroup,
  getModifiersByGroup,
  createModifier,
  updateModifier,
  deleteModifier,
} from '../api/modifierGroups'
import type { ProductDto, ModifierGroupDto, ModifierDto } from '../types'

interface Props {
  product: ProductDto
  onClose: () => void
}

const defaultGroupForm = { name: '', minSelections: 0, maxSelections: 1, isRequired: false }
const defaultModifierForm = { name: '', description: '' }

export default function ProductModifiersModal({ product, onClose }: Props) {
  const qc = useQueryClient()

  // Grupo seleccionado para editar / expandir
  const [expandedGroupId, setExpandedGroupId] = useState<number | null>(null)
  const [groupModal, setGroupModal] = useState<'create' | 'edit' | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<ModifierGroupDto | null>(null)
  const [groupForm, setGroupForm] = useState(defaultGroupForm)

  // Modificador seleccionado para editar
  const [modifierModal, setModifierModal] = useState<'create' | 'edit' | null>(null)
  const [selectedModifier, setSelectedModifier] = useState<ModifierDto | null>(null)
  const [modifierForm, setModifierForm] = useState(defaultModifierForm)

  // Traer todos los grupos y filtrar por productId
  const { data: allGroups, isLoading } = useQuery({
    queryKey: ['modifierGroups'],
    queryFn: () => getModifierGroups(1),
  })
  const groups = (allGroups?.items ?? []).filter(g => g.productId === product.id)

  const invalidateGroups = () => qc.invalidateQueries({ queryKey: ['modifierGroups'] })

  // --- Mutaciones de grupos ---
  const createGroupMut = useMutation({
    mutationFn: () => createModifierGroup(
      groupForm.name, groupForm.minSelections, groupForm.maxSelections,
      groupForm.isRequired, product.id, null,
    ),
    onSuccess: () => { invalidateGroups(); setGroupModal(null) },
  })

  const updateGroupMut = useMutation({
    mutationFn: () => updateModifierGroup(
      selectedGroup!.id, groupForm.name,
      groupForm.minSelections, groupForm.maxSelections, groupForm.isRequired,
    ),
    onSuccess: () => { invalidateGroups(); setGroupModal(null) },
  })

  const deleteGroupMut = useMutation({
    mutationFn: (id: number) => deleteModifierGroup(id),
    onSuccess: () => { invalidateGroups(); setExpandedGroupId(null) },
  })

  // --- Mutaciones de modificadores ---
  const createModifierMut = useMutation({
    mutationFn: () => createModifier(expandedGroupId!, modifierForm.name, modifierForm.description || null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modifiers', expandedGroupId] })
      setModifierModal(null)
    },
  })

  const updateModifierMut = useMutation({
    mutationFn: () => updateModifier(selectedModifier!.id, modifierForm.name, modifierForm.description || null),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['modifiers', expandedGroupId] })
      setModifierModal(null)
    },
  })

  const deleteModifierMut = useMutation({
    mutationFn: ({ id, groupId }: { id: number; groupId: number }) => deleteModifier(id).then(() => groupId),
    onSuccess: (groupId) => qc.invalidateQueries({ queryKey: ['modifiers', groupId] }),
  })

  // --- Helpers ---
  const openCreateGroup = () => {
    setGroupForm(defaultGroupForm)
    setSelectedGroup(null)
    setGroupModal('create')
  }

  const openEditGroup = (g: ModifierGroupDto) => {
    setSelectedGroup(g)
    setGroupForm({ name: g.name, minSelections: g.minSelections, maxSelections: g.maxSelections, isRequired: g.isRequired })
    setGroupModal('edit')
  }

  const openCreateModifier = (groupId: number) => {
    setExpandedGroupId(groupId)
    setModifierForm(defaultModifierForm)
    setSelectedModifier(null)
    setModifierModal('create')
  }

  const openEditModifier = (m: ModifierDto) => {
    setSelectedModifier(m)
    setModifierForm({ name: m.name, description: m.description ?? '' })
    setModifierModal('edit')
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-bold text-gray-900">Grupos de modificadores</h2>
            <p className="text-xs text-gray-400 mt-0.5">{product.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={openCreateGroup}
              className="bg-gray-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-gray-700 transition-colors"
            >
              + Nuevo grupo
            </button>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
          {isLoading ? (
            <p className="text-center text-gray-400 text-sm py-8">Cargando...</p>
          ) : groups.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400 text-sm">Este producto no tiene grupos de modificadores.</p>
              <button onClick={openCreateGroup} className="mt-3 text-sm text-gray-900 font-semibold underline underline-offset-2">
                Crear el primero
              </button>
            </div>
          ) : (
            groups.map(group => (
              <GroupRow
                key={group.id}
                group={group}
                isExpanded={expandedGroupId === group.id}
                onToggle={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                onEdit={() => openEditGroup(group)}
                onDelete={() => deleteGroupMut.mutate(group.id)}
                onAddModifier={() => openCreateModifier(group.id)}
                onEditModifier={openEditModifier}
                onDeleteModifier={(modId) => deleteModifierMut.mutate({ id: modId, groupId: group.id })}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal grupo */}
      {groupModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">
              {groupModal === 'create' ? 'Nuevo grupo de modificadores' : 'Editar grupo'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</label>
                <input
                  value={groupForm.name}
                  onChange={e => setGroupForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Ej: Cocción, Extras, Salsas"
                />
              </div>

              <div className="flex items-center gap-3">
                <input
                  id="isRequired"
                  type="checkbox"
                  checked={groupForm.isRequired}
                  onChange={e => setGroupForm(f => ({ ...f, isRequired: e.target.checked }))}
                  className="w-4 h-4 accent-gray-900"
                />
                <label htmlFor="isRequired" className="text-sm text-gray-700">Selección requerida</label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Mín. selecciones</label>
                  <input
                    type="number"
                    min={0}
                    value={groupForm.minSelections}
                    onChange={e => setGroupForm(f => ({ ...f, minSelections: Number(e.target.value) }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Máx. selecciones</label>
                  <input
                    type="number"
                    min={1}
                    value={groupForm.maxSelections}
                    onChange={e => setGroupForm(f => ({ ...f, maxSelections: Number(e.target.value) }))}
                    className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setGroupModal(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
              <button
                onClick={() => groupModal === 'create' ? createGroupMut.mutate() : updateGroupMut.mutate()}
                disabled={!groupForm.name || createGroupMut.isPending || updateGroupMut.isPending}
                className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {createGroupMut.isPending || updateGroupMut.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal modificador */}
      {modifierModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-60 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">
              {modifierModal === 'create' ? 'Nueva opción' : 'Editar opción'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nombre</label>
                <input
                  value={modifierForm.name}
                  onChange={e => setModifierForm(f => ({ ...f, name: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Ej: Término medio, Sin cebolla"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Descripción <span className="text-gray-300 font-normal">(opcional)</span></label>
                <input
                  value={modifierForm.description}
                  onChange={e => setModifierForm(f => ({ ...f, description: e.target.value }))}
                  className="mt-1 w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gray-400"
                  placeholder="Opcional"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <button onClick={() => setModifierModal(null)} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700">Cancelar</button>
              <button
                onClick={() => modifierModal === 'create' ? createModifierMut.mutate() : updateModifierMut.mutate()}
                disabled={!modifierForm.name || createModifierMut.isPending || updateModifierMut.isPending}
                className="bg-gray-900 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-40 transition-colors"
              >
                {createModifierMut.isPending || updateModifierMut.isPending ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GroupRow({
  group, isExpanded, onToggle, onEdit, onDelete, onAddModifier, onEditModifier, onDeleteModifier,
}: {
  group: ModifierGroupDto
  isExpanded: boolean
  onToggle: () => void
  onEdit: () => void
  onDelete: () => void
  onAddModifier: () => void
  onEditModifier: (m: ModifierDto) => void
  onDeleteModifier: (id: number) => void
}) {
  const { data: modifiersData } = useQuery({
    queryKey: ['modifiers', group.id],
    queryFn: () => getModifiersByGroup(group.id),
    enabled: isExpanded,
  })
  const modifiers = modifiersData?.items ?? []

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      {/* Cabecera del grupo */}
      <div className="flex items-center gap-3 px-4 py-3 bg-gray-50">
        <button onClick={onToggle} className="text-gray-400 hover:text-gray-600 transition-colors">
          <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
        <div className="flex-1 min-w-0" onClick={onToggle} role="button">
          <p className="font-semibold text-gray-900 text-sm">{group.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            {group.isRequired && (
              <span className="text-[10px] bg-red-50 text-red-500 font-semibold px-1.5 py-0.5 rounded">Requerido</span>
            )}
            <span className="text-[10px] text-gray-400">
              {group.minSelections === group.maxSelections
                ? `Elegí ${group.maxSelections}`
                : `${group.minSelections}–${group.maxSelections} opciones`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onEdit} className="text-xs text-gray-500 hover:text-gray-900 font-medium px-2 py-1 rounded hover:bg-gray-200 transition-colors">
            Editar
          </button>
          <button onClick={onDelete} className="text-xs text-red-400 hover:text-red-600 font-medium px-2 py-1 rounded hover:bg-red-50 transition-colors">
            Eliminar
          </button>
        </div>
      </div>

      {/* Opciones expandidas */}
      {isExpanded && (
        <div className="px-4 py-3 space-y-1">
          {modifiers.length === 0 ? (
            <p className="text-xs text-gray-400 py-2">Sin opciones aún.</p>
          ) : (
            modifiers.map(m => (
              <div key={m.id} className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
                <div>
                  <span className="text-sm text-gray-800 font-medium">{m.name}</span>
                  {m.description && <span className="text-xs text-gray-400 ml-2">{m.description}</span>}
                </div>
                <div className="flex gap-1">
                  <button onClick={() => onEditModifier(m)} className="text-xs text-gray-400 hover:text-gray-700 px-2 py-0.5 rounded hover:bg-gray-100 transition-colors">
                    Editar
                  </button>
                  <button onClick={() => onDeleteModifier(m.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50 transition-colors">
                    Eliminar
                  </button>
                </div>
              </div>
            ))
          )}
          <button
            onClick={onAddModifier}
            className="mt-2 text-xs text-gray-500 hover:text-gray-900 font-medium flex items-center gap-1 transition-colors"
          >
            <span className="text-base leading-none">+</span> Agregar opción
          </button>
        </div>
      )}
    </div>
  )
}
