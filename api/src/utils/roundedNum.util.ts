export function roundedNumber(originalNumber: number, precision: number = 2) {
    const tenExp = Math.pow(10, precision);
    return Math.round(originalNumber * tenExp) / tenExp;
}
