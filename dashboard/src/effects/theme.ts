const STORAGE_KEY = 'theme'

export function applyTheme(theme: string): void {
    document.documentElement.setAttribute('data-bs-theme', theme)
}

export function getTheme(): string {
    return localStorage.getItem(STORAGE_KEY) ?? 'light'
}

export function toggleTheme(): string {
    const current = getTheme()
    const next = current === 'dark' ? 'light' : 'dark'
    localStorage.setItem(STORAGE_KEY, next)
    applyTheme(next)
    return next
}

export function initTheme(): void {
    applyTheme(getTheme())
}
