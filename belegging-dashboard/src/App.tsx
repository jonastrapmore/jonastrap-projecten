function App() {
  return (
    <>
      <header className="trap-bg-primary text-white py-3">
        <div className="container d-flex align-items-center gap-2">
          <i className="bi bi-graph-up-arrow fs-4"></i>
          <span className="fs-5 fw-semibold ls-1">Beleggingsdashboard</span>
        </div>
      </header>

      <main className="container py-4">
        <div className="card shadow-sm">
          <div className="card-header d-flex align-items-center gap-2">
            <i className="bi bi-wallet2 trap-text-accent"></i>
            <span className="fw-semibold">Portefeuille</span>
            <span className="badge bg-secondary ms-auto">nog geen data</span>
          </div>
          <div className="card-body">
            <p className="mb-2">
              De opzet staat. Hierna lezen we de Revolut-export in en bouwen we
              het ledger op.
            </p>
            <p className="text-muted small mb-0">
              Deze kaart is voorlopig enkel een controle: zie je de navy balk,
              de lichtblauwe achtergrond en dit kader met een oranje icoontje,
              dan is de huisstijl correct aangesloten.
            </p>
          </div>
        </div>
      </main>
    </>
  );
}

export default App;
