import { JSONArray } from "@org.quicko/core";

export function snakeCaseToHumanReadable(headers: JSONArray): string[];
export function snakeCaseToHumanReadable(key: string): string;
export function snakeCaseToHumanReadable(input: JSONArray | string): string[] | string {
    if (Array.isArray(input)) {
        return input.map(header => snakeCaseToHumanReadable(header?.toString() || ''));
    }

    return input.split('_')
        .map(part => part === 'utm' ? 'UTM' : part[0].toLocaleUpperCase() + part.slice(1))
        .join(' ');
}
