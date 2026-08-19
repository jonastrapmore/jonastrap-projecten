/**
 * Zet een getal-als-tekst om naar een geheel getal, geschaald met een
 * vast aantal decimalen. Raakt nooit een kommagetal aan, dus exact.
 *
 * parseScaled('6332.07', 2)      -> 633207
 * parseScaled('100', 2)          -> 10000
 * parseScaled('8.97129186', 8)   -> 897129186
 */
export function parseScaled(text: string, decimals: number): number {
    // 1. splits op de punt
    // 2. het deel na de punt aanvullen tot precies `decimals` tekens
    // 3. beide delen aan elkaar plakken
    // 4. omzetten naar een getal

    const parts = text.split('.')
    const whole = parts[0]
    const fraction = (parts[1] || '').padEnd(decimals, '0')

    if(fraction.length > decimals) {
        throw new Error(
            `te veel decimalen gedetecteerd voor waarde '${text}'. Maximaal toegestaan: ${decimals}, maar kreeg er ${fraction.length}`
        )        
    }
    const combined = whole + fraction
    return Number(combined)

}