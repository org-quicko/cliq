export function maskInfo(value: string): string {
    if (!value) return value;

    // Mask emails (e.g., `johndoe@example.com` → `j*****@example.com`)
    if (value.includes('@')) {
        const [user, domain] = value.split('@');
        return `${user[0]}*****@${domain}`;
    }

    // Mask phone numbers (e.g., `+1234567890` → `+12****7890`)
    if (/^\+?\d{8,13}$/.test(value)) {
        return value.replace(/(\d{2})\d+(\d{2})/, '$1****$2');
    }

    return value;
}
