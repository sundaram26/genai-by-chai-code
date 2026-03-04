import { encode } from "./encoder";
import { BPETokenizer } from "./trainer";

function countPairs(tokens: number[]) {
  const pairFreq = new Map<string, number>();

  for (let i = 0; i < tokens.length - 1; i++) {
    const key = `${tokens[i]}-${tokens[i + 1]}`;
    pairFreq.set(key, (pairFreq.get(key) ?? 0) + 1);
  }

  return pairFreq;
}

function getMostFrequentPair(pairFreq: Map<string, number>) {
  let maxVal = -Infinity;
  let maxKey: string | null = null;

  for (const [key, value] of pairFreq) {
    if (value > maxVal) {
      maxVal = value;
      maxKey = key;
    }
  }

  return maxKey;
}

function mergePairs() {
  
}

function merge(text: string) {
  const byteToken = Array.from(encode(text));
  // Train one step
  const pairFreq: Map<string, number> = countPairs(byteToken);

  const bestPair = getMostFrequentPair(pairFreq);

  const tokerninzer = new BPETokenizer();
  const newId = tokerninzer.createNewTokenId();

  const mergedP = "";

  return mergedP;
}


const str = `
In 2026, José said: “Hello, 世界! 👋🚀” while debugging const π = 3.14159; at 03:45 AM.
His café bill was €12.50 (₹1045.75), uptime = 99.99%, latency ≤ 10 ms.
Meanwhile العربية تُكتب من اليمين ← اليسار, हिंदी भी यहाँ है, and emojis like 🤖✨🔥 coexist with math ∑x², arrows → ⇄, and URLs such as [https://example.com?q=テスト#α](https://example.com?q=テスト#α).
Final check: naïve façade coöperate — does it tokenize correctly? ✅
`;