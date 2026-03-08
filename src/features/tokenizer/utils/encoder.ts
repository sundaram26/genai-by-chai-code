
export function encode(text: string) {
    // UTF-8 unicode
    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);
    
    return Array.from(bytes);
}

export function decode(token: number[]) {
    const encodedText = new Uint8Array(token)
    const decoder = new TextDecoder('utf-8');
    const decodedText = decoder.decode(encodedText);

    return decodedText;
}

