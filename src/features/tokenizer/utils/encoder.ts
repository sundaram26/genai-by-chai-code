
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

const str = `
In 2026, José said: “Hello, 世界! 👋🚀” while debugging const π = 3.14159; at 03:45 AM.
His café bill was €12.50 (₹1045.75), uptime = 99.99%, latency ≤ 10 ms.
Meanwhile العربية تُكتب من اليمين ← اليسار, हिंदी भी यहाँ है, and emojis like 🤖✨🔥 coexist with math ∑x², arrows → ⇄, and URLs such as [https://example.com?q=テスト#α](https://example.com?q=テスト#α).
Final check: naïve façade coöperate — does it tokenize correctly? ✅
`;


const bytes = encode(str);
const restored = decode(bytes);
console.log("Tokenize: ", restored === str);
