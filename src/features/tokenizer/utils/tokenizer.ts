import { readFile } from "fs/promises";
import { encode as utf8Encode, decode as utf8Decode } from "./encoder";

export class Tokenizer {
    private vocab = new Map<number, Uint8Array>();
    private merges = new Map<string, number>();

    async load() {
        const vocabData = JSON.parse(await readFile("vocab.json", "utf8"));
        const mergesData = JSON.parse(await readFile("merges.json", "utf8"));

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

    decode(tokens: number[]): string {
        const bytes: number[] = [];

        for (const token of tokens) {
            const tokenBytes = this.vocab.get(token);
            if (!tokenBytes) {
                throw new Error(`Token ID ${token} not found in vocabulary`);
            }
            for (const byte of tokenBytes) {
                bytes.push(byte);
            }
        }

        return utf8Decode(bytes);
    }
}
