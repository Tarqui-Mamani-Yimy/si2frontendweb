import Badge from '../../../components/ui/Badge'

/**
 * PlanCuentasTreeNode — Representación recursiva de un nodo en el árbol de cuentas.
 */
function PlanCuentasTreeNode({
  node,
  selectedId,
  onSelectAccount,
  onOpenCrearAnalitica,
  expandedIds,
  onToggleExpand,
}) {
  const children = Array.isArray(node.hijos)
    ? node.hijos
    : Array.isArray(node.children)
      ? node.children
      : []

  const hasChildren = children.length > 0
  const isExpanded = expandedIds.has(node.id)
  const isSelected = selectedId === node.id

  const isLevel4Subcuenta = Number(node.nivel) === 4
  const canHaveAnalitica =
    isLevel4Subcuenta && node.es_oficial && node.estado === 'ACTIVA'

  // Icon depending on level
  function getNodeIcon() {
    switch (Number(node.nivel)) {
      case 1:
        return 'account_balance'
      case 2:
        return 'folder'
      case 3:
        return 'folder_open'
      case 4:
        return 'article'
      case 5:
        return 'domain_add'
      default:
        return 'description'
    }
  }

  // Padding left according to depth (nivel 1..5)
  const depth = Math.max(0, (Number(node.nivel) || 1) - 1)
  const paddingLeft = `${depth * 20 + 8}px`

  return (
    <div className="select-none">
      <div
        onClick={() => onSelectAccount(node)}
        style={{ paddingLeft }}
        className={`group flex items-center justify-between py-2 pr-3 rounded-lg cursor-pointer transition-colors duration-150 border-l-3 ${
          isSelected
            ? 'bg-emerald-50/80 border-[#064e3b] text-[#064e3b]'
            : 'border-transparent hover:bg-slate-50/80 text-slate-700'
        }`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {/* Caret icon for expand/collapse */}
          {hasChildren ? (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(node.id)
              }}
              aria-label={isExpanded ? 'Colapsar subcuentas' : 'Expandir subcuentas'}
              className="h-6 w-6 flex items-center justify-center rounded hover:bg-slate-200/60 text-slate-500 shrink-0 transition-transform"
            >
              <span
                className={`material-symbols-outlined text-[18px] transition-transform duration-150 ${
                  isExpanded ? 'rotate-90 text-[#064e3b]' : 'text-slate-400'
                }`}
              >
                chevron_right
              </span>
            </button>
          ) : (
            <span className="w-6 shrink-0" />
          )}

          {/* Level Icon */}
          <span
            className={`material-symbols-outlined text-[17px] shrink-0 ${
              isSelected
                ? 'text-[#064e3b]'
                : node.es_oficial
                  ? 'text-slate-400'
                  : 'text-indigo-500'
            }`}
          >
            {getNodeIcon()}
          </span>

          {/* Account Code */}
          <span
            className={`font-mono text-xs font-bold shrink-0 tracking-tight ${
              isSelected ? 'text-[#064e3b]' : 'text-slate-900'
            }`}
          >
            {node.codigo}
          </span>

          {/* Account Name */}
          <span
            className={`text-xs truncate ${
              isSelected
                ? 'font-bold text-[#064e3b]'
                : Number(node.nivel) <= 3
                  ? 'font-semibold text-slate-800'
                  : 'font-normal text-slate-700'
            }`}
            title={node.nombre}
          >
            {node.nombre}
          </span>
        </div>

        {/* Badges and Quick Actions */}
        <div className="flex items-center gap-1.5 shrink-0 pl-2">
          {/* Nature */}
          <Badge
            variant={node.naturaleza === 'DEUDORA' ? 'teal' : 'navy'}
            className="!text-[9px] !py-0 !px-1.5 hidden sm:inline-flex"
          >
            {node.naturaleza === 'DEUDORA' ? 'Deudora' : 'Acreedora'}
          </Badge>

          {/* Regularizadora */}
          {node.es_regularizadora && (
            <Badge
              variant="amber"
              className="!text-[9px] !py-0 !px-1.5"
            >
              Reg.
            </Badge>
          )}

          {/* Inactiva */}
          {node.estado === 'INACTIVA' && (
            <Badge variant="red" className="!text-[9px] !py-0 !px-1.5">
              Inactiva
            </Badge>
          )}

          {/* Oficial ASFI vs Analítica */}
          {node.es_oficial ? (
            <Badge variant="slate" className="!text-[9px] !py-0 !px-1.5">
              ASFI
            </Badge>
          ) : (
            <Badge variant="purple" className="!text-[9px] !py-0 !px-1.5">
              Analítica
            </Badge>
          )}

          {/* Quick action: Add Analytic under Level 4 */}
          {canHaveAnalitica && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onOpenCrearAnalitica(node)
              }}
              title="Crear cuenta analítica bajo esta subcuenta"
              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 p-1 rounded-md text-emerald-700 hover:bg-emerald-100"
            >
              <span className="material-symbols-outlined text-[16px] block">add_box</span>
            </button>
          )}
        </div>
      </div>

      {/* Render children if expanded */}
      {hasChildren && isExpanded && (
        <div className="relative">
          <div
            className="absolute top-0 bottom-2 border-l border-slate-200"
            style={{ left: `${depth * 20 + 20}px` }}
          />
          {children.map((child) => (
            <PlanCuentasTreeNode
              key={child.id || child.codigo}
              node={child}
              selectedId={selectedId}
              onSelectAccount={onSelectAccount}
              onOpenCrearAnalitica={onOpenCrearAnalitica}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  )
}

/**
 * PlanCuentasTree — Componente principal del árbol colapsable de cuentas.
 *
 * @param {{
 *   data: Array<object> | object | null,
 *   selectedId: number | string | null,
 *   onSelectAccount: (account: object) => void,
 *   onOpenCrearAnalitica: (parentAccount: object) => void,
 *   expandedIds: Set<number|string>,
 *   onToggleExpand: (nodeId: number|string) => void,
 *   onExpandAll: () => void,
 *   onCollapseAll: () => void,
 * }} props
 */
export default function PlanCuentasTree({
  data,
  selectedId,
  onSelectAccount,
  onOpenCrearAnalitica,
  expandedIds,
  onToggleExpand,
  onExpandAll,
  onCollapseAll,
}) {
  const rootNodes = Array.isArray(data) ? data : data ? [data] : []

  if (rootNodes.length === 0) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-slate-500 space-y-2">
        <span className="material-symbols-outlined text-[36px] text-slate-300 block mb-1">
          account_tree
        </span>
        <span className="font-semibold text-slate-700 block text-sm">
          No hay cuentas disponibles en esta clase
        </span>
        <span className="text-xs text-slate-400 block">
          Seleccione otra clase contable o verifique la conexión con el servidor.
        </span>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
      {/* Tree Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-100 bg-slate-50/70 text-xs text-slate-600">
        <span className="font-semibold flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[16px] text-emerald-800">
            schema
          </span>
          <span>Nomenclatura Jerárquica</span>
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onExpandAll}
            className="px-2 py-1 rounded text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition"
          >
            Expandir todo
          </button>
          <span className="text-slate-300">•</span>
          <button
            type="button"
            onClick={onCollapseAll}
            className="px-2 py-1 rounded text-[11px] font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition"
          >
            Colapsar todo
          </button>
        </div>
      </div>

      {/* Tree Content */}
      <div className="p-2 divide-y divide-slate-100/50 max-h-[640px] overflow-y-auto">
        {rootNodes.map((root) => (
          <PlanCuentasTreeNode
            key={root.id || root.codigo}
            node={root}
            selectedId={selectedId}
            onSelectAccount={onSelectAccount}
            onOpenCrearAnalitica={onOpenCrearAnalitica}
            expandedIds={expandedIds}
            onToggleExpand={onToggleExpand}
          />
        ))}
      </div>
    </div>
  )
}
