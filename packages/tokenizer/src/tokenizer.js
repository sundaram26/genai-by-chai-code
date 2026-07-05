import { encode as utf8Encode, decode as utf8Decode } from "./encoder";
import * as fs from "fs/promises";
import * as path from "path";
export class Tokenizer {
    vocab = new Map();
    merges = new Map();
    async load(customVococabPath, customMergesPath) {
        // Fallback to reading relative to this module's directory
        const vocabPath = customVococabPath || path.resolve(__dirname, "vocab.json");
        const mergesPath = customMergesPath || path.resolve(__dirname, "merges.json");
        const vocabData = JSON.parse(await fs.readFile(vocabPath, "utf8"));
        const mergesData = JSON.parse(await fs.readFile(mergesPath, "utf8"));
        this.loadFromData(vocabData, mergesData);
    }
    loadFromData(vocabData, mergesData) {
        this.vocab = new Map(Object.entries(vocabData).map(([k, v]) => [
            Number(k),
            new Uint8Array(v),
        ]));
        this.merges = new Map(Object.entries(mergesData));
    }
    bpeEncode(text) {
        let tokens = utf8Encode(text);
        const mergePairs = [...this.merges.entries()].sort((a, b) => a[1] - b[1]);
        for (const [pair, newId] of mergePairs) {
            const [first, second] = pair.split("-").map((val) => Number(val));
            const newToken = [];
            let i = 0;
            while (i < tokens.length) {
                if (i < tokens.length - 1 &&
                    tokens[i] === first &&
                    tokens[i + 1] === second) {
                    newToken.push(newId);
                    i += 2;
                }
                else {
                    newToken.push(tokens[i]);
                    i++;
                }
            }
            tokens = newToken;
        }
        return tokens;
    }
    bpeDecode(tokens) {
        const bytes = [];
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
    tokenize(text) {
        const tokens = this.bpeEncode(text);
        const tokenDetails = tokens.map((id) => {
            const bytes = this.vocab.get(id) || new Uint8Array();
            let textValue = "";
            try {
                textValue = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
            }
            catch {
                textValue = "";
            }
            return {
                id,
                text: textValue,
                bytes: Array.from(bytes),
            };
        });
        const totalBytes = new TextEncoder().encode(text).length;
        const compressionRatio = tokens.length > 0 ? (totalBytes / tokens.length).toFixed(2) : "0.00";
        return {
            tokens,
            tokenDetails,
            metrics: {
                charCount: text.length,
                byteCount: totalBytes,
                tokenCount: tokens.length,
                compressionRatio,
            },
        };
    }
    getVocabList() {
        return Array.from(this.vocab.entries()).map(([id, bytes]) => {
            let textValue = "";
            try {
                textValue = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
            }
            catch {
                textValue = "";
            }
            return {
                id,
                text: textValue,
                bytes: Array.from(bytes),
            };
        }).sort((a, b) => a.id - b.id);
    }
    getMergesList() {
        return Array.from(this.merges.entries()).map(([pair, id]) => {
            const [first, second] = pair.split("-").map(Number);
            return {
                id,
                pair,
                first,
                second
            };
        }).sort((a, b) => a.id - b.id);
    }
    getVocab() {
        return this.vocab;
    }
    getMerges() {
        return this.merges;
    }
}
