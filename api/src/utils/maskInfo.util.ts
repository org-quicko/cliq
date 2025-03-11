export function maskInfo(value: string): string {
    if (!value) return value;

    // Mask emails (e.g., `johndoe@example.com` → `j*****@example.com`)
    if (value.includes('@')) {
        const [user, domain] = value.split('@');
        return `${user[0]}*****@${domain}`;
    }

    // Mask phone numbers (e.g., `+1234567890` → `+12****7890`)
    if (/^\+?\d{10,15}$/.test(value)) {
        return value.replace(/(\d{2})\d+(\d{2})/, '$1****$2');
    }

    // Mask names (e.g., `John Doe` → `J*** D**`)
    return value
        .split(' ')
        .map(part => (part.length > 2 ? part[0] + '*'.repeat(part.length - 2) + part.slice(-1) : part))
        .join(' ');
}
