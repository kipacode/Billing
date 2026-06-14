// In-memory challenge store with 5-minute TTL
const challenges = new Map<string, { challenge: string; expires: number }>();

export function setChallenge(key: string, challenge: string) {
    challenges.set(key, { challenge, expires: Date.now() + 5 * 60 * 1000 });
}

export function getChallenge(key: string): string | null {
    const entry = challenges.get(key);
    if (!entry || entry.expires < Date.now()) {
        challenges.delete(key);
        return null;
    }
    challenges.delete(key);
    return entry.challenge;
}
