import { readFile, writeFile } from "fs/promises";
import { encode } from "./encoder";

export class BPETokenizer {
    private vocabulary: Map<number, Uint8Array>;
    private merges: Map<string, number>;
    private nextId: number;

    constructor() {
        this.vocabulary = new Map();
        this.merges = new Map();
        this.nextId = 256;

        for (let i = 0; i < 256; i++) {
          this.vocabulary.set(i, new Uint8Array([i]));
        }
    }

    private createNewTokenId(): number {
        return this.nextId++;
    }

    private countPairs(tokens: number[]) {
        const pairFreq = new Map<string, number>();

        for (let i = 0; i < tokens.length - 1; i++) {
            const key = `${tokens[i]}-${tokens[i + 1]}`;
            pairFreq.set(key, (pairFreq.get(key) ?? 0) + 1);
        }

        return pairFreq;
    }

    private getMostFrequentPair(pairFreq: Map<string, number>) {
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

    private mergePairs(token: number[], bestPairs: string, id: number) {
        const pairArr = bestPairs.split("-").map((pair) => Number(pair));
        const newToken: number[] = [];

        let i = 0;
        while (i < token.length) {
            if (
                i < token.length - 1 &&
                token[i] === pairArr[0] &&
                token[i + 1] === pairArr[1]
            ) {
                newToken.push(id);
                i += 2;
            } else {
                newToken.push(token[i]);
                i++;
            }
        }

        return newToken;
    }

    async train(text: string, target: number) {
        let token = Array.from(encode(text));
        while (this.nextId < target) {
            // Train one step
            const pairFreq: Map<string, number> = this.countPairs(token);

            const bestPair: string | null = this.getMostFrequentPair(pairFreq);

            if (!bestPair) break;

            const newId = this.createNewTokenId();

            const pairArr = bestPair.split("-").map(Number);

            const token1Bytes = this.vocabulary.get(pairArr[0])!;
            const token2Bytes = this.vocabulary.get(pairArr[1])!;

            const mergedBytes = new Uint8Array(
              token1Bytes.length + token2Bytes.length,
            );
            mergedBytes.set(token1Bytes, 0);
            mergedBytes.set(token2Bytes, token1Bytes.length);

            this.vocabulary.set(newId, mergedBytes);

            this.merges.set(bestPair, newId);

            token = this.mergePairs(token, bestPair, newId);
        }

        await writeFile(
            "vocab.json",
            JSON.stringify(
                Object.fromEntries(
                    [...this.vocabulary.entries()].map(([k, v]) => [
                        k,
                        Array.from(v),
                    ]),
                ),
                null,
                2,
            ),
        );

        await writeFile(
            "merges.json",
            JSON.stringify(Object.fromEntries(this.merges), null, 2),
        );

        return token;
    }
}
