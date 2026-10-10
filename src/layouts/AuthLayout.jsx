import { Outlet } from 'react-router-dom'

export default function AuthLayout() {
  return (
    <div
      className="min-h-screen text-[#0b1c30] flex items-center justify-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-[#f0f4f9]"
      style={{
        backgroundImage:
          'radial-gradient(at 0% 0%, rgba(111, 251, 190, 0.15) 0px, transparent 50%), radial-gradient(at 100% 100%, rgba(6, 78, 59, 0.12) 0px, transparent 50%)',
      }}
    >
      {/* Fondos radiales difusos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-40 -left-40 h-[500px] w-[500px] rounded-full bg-emerald-500/10 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[500px] rounded-full bg-[#6cf8bb]/15 blur-3xl"
      />

      <div className="w-full flex justify-center items-center z-10 animate-fade-in">
        <Outlet />
      </div>
    </div>
  )
}
