export function encode(text) {
    // UTF-8 unicode
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    return Array.from(bytes);
}
export function decode(token) {
    const encodedText = new Uint8Array(token);
    const decoder = new TextDecoder('utf-8');
    const decodedText = decoder.decode(encodedText);
    return decodedText;
}
