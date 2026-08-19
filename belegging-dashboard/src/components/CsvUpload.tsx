import type { ChangeEvent } from 'react';

type CsvUploadProps = {
    /** Wordt aangeroepen met de volledige inhoud van het gekozen bestand. */
    onFileRead: (text: string) => void;
};

/**
 * Laat de gebruiker een CSV-bestand kiezen en geeft de inhoud door.
 * Weet niets van Revolut of van transacties: dit component leest enkel
 * een bestand in. Wat er daarna mee gebeurt, bepaalt de ouder.
 */
export function CsvUpload({ onFileRead }: CsvUploadProps) {
    async function handleChange(event: ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }
        onFileRead(await file.text());
    }

    return (
        <div className="card shadow-sm mb-4">
            <div className="card-header d-flex align-items-center gap-2">
                <i className="bi bi-filetype-csv trap-text-accent"></i>
                <span className="fw-semibold">Transacties inlezen</span>
            </div>
            <div className="card-body">
                <label htmlFor="csv-input" className="form-label">
                    Kies je Revolut-export
                </label>
                <input
                    id="csv-input"
                    type="file"
                    accept=".csv"
                    className="form-control"
                    onChange={handleChange}
                />
                <p className="text-muted small mt-2 mb-0">
                    Het bestand wordt enkel in je browser gelezen en verlaat je computer niet.
                </p>
            </div>
        </div>
    );
}
