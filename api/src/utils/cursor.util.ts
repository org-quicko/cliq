/**
 * Utility functions for cursor-based pagination
 * Handles encoding and decoding of pagination cursors
 */

/**
 * Encodes a Date object into a base64 cursor string for pagination
 * @param date - The date to encode as a cursor
 * @returns Base64 encoded cursor string
 */
export function encodeCursor(date: Date): string {
    return Buffer.from(date.toISOString()).toString('base64');
}

/**
 * Decodes a base64 cursor string back to a Date object
 * @param cursor - The base64 encoded cursor string
 * @returns Decoded Date object
 */
export function decodeCursor(cursor: string): Date {
    return new Date(Buffer.from(cursor, 'base64').toString());
}
