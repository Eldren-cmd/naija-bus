function App() {
  return (
    <main className="min-h-screen bg-[#FFF8F0] px-6 py-16 text-[#0D1B2A]">
      <section className="mx-auto max-w-3xl rounded-3xl border border-[#E8D5C0] bg-white p-8 shadow-sm">
        <p className="mb-3 text-sm font-medium uppercase tracking-[0.12em] text-[#CC5500]">
          Phase 1 · Task 1.2
        </p>
        <h1 className="mb-3 text-4xl font-semibold leading-tight" style={{ fontFamily: "var(--font-display)" }}>
          Naija Transport Route & Fare Finder
        </h1>
        <p className="text-base leading-7 text-slate-600">
          Frontend scaffold is now running with Vite, React, TypeScript, and Tailwind CSS.
          Next steps will implement the full MVP screens and interactions from the development plan.
        </p>
      </section>
      <div className="mx-auto mt-6 max-w-3xl rounded-2xl border border-dashed border-[#E8D5C0] bg-[#FFF3E8] p-5 text-sm text-slate-700">
        Tech stack: React + TypeScript + Vite + Tailwind CSS
      </div>
    </main>
  )
}

export default App
