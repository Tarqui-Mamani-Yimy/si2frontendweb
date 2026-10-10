/**
 * Card — contenedor base NexaCoop Precision.
 *
 * Props:
 *   as:        elemento HTML ('div' por defecto)
 *   className: clases adicionales
 *   children:  contenido
 */
export default function Card({ as: Tag = 'div', className = '', children, ...rest }) {
  return (
    <Tag
      className={`rounded-xl bg-white border border-[#e2e8f0] shadow-card transition-all duration-200 hover:shadow-card-hover hover:border-[#cbd5e1] ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  )
}
