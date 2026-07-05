import { encode as utf8Encode, decode as utf8Decode } from "./encoder";
import * as fs from "fs/promises";
import * as path from "path";

export class Tokenizer {
    private vocab = new Map<number, Uint8Array>();
    private merges = new Map<string, number>();

    async load(customVocabPath?: string, customMergesPath?: string) {
        // Fallback to reading relative to this module's directory
        const vocabPath = customVocabPath || path.resolve(__dirname, "vocab.json");
        const mergesPath = customMergesPath || path.resolve(__dirname, "merges.json");

        const vocabData = JSON.parse(await fs.readFile(vocabPath, "utf8"));
        const mergesData = JSON.parse(await fs.readFile(mergesPath, "utf8"));

        this.loadFromData(vocabData, mergesData);
    }

    loadFromData(vocabData: Record<number, number[]>, mergesData: Record<string, number>) {
        this.vocab = new Map(
            Object.entries(vocabData).map(([k, v]) => [
                Number(k),
                new Uint8Array(v as number[]),
            ]),
        );

        this.merges = new Map(Object.entries(mergesData));
    }

    bpeEncode(text: string): number[] {
        let tokens = utf8Encode(text);

        const mergePairs = [...this.merges.entries()].sort((a, b) => a[1] - b[1]);

        for (const [pair, newId] of mergePairs) {
            const [first, second] = pair.split("-").map((val) => Number(val));
            const newToken: number[] = [];

            let i = 0;
            while (i < tokens.length) {
                if (
                    i < tokens.length - 1 &&
                    tokens[i] === first &&
                    tokens[i + 1] === second
                ) {
                    newToken.push(newId);
                    i += 2;
                } else {
                    newToken.push(tokens[i]);
                    i++;
                }
            }
            tokens = newToken;
        }
        return tokens;
    }

    bpeDecode(tokens: number[]): string {
        const bytes: number[] = [];

        for (const token of tokens) {
            const tokenBytes = this.vocab.get(token);
            if (!tokenBytes) {
                throw new Error(`Token ID ${token} not found in vocabulary`);
            }
            for (const byte of tokenBytes) {
                bytes.push(byte);
            }
            console.log(`Decoded token ${token} to bytes:`, `${Array.from(tokenBytes)} - ${utf8Decode(Array.from(tokenBytes))}`);
        }

        return utf8Decode(bytes);
    }

    getVocab() {
        return this.vocab;
    }

    getMerges() {
        return this.merges;
    }
}
