import { readFile, writeFile } from "fs/promises";
import * as path from "path";
import { encode } from "./encoder";
export class BPETokenizer {
    vocabulary;
    merges;
    nextId;
    constructor() {
        this.vocabulary = new Map();
        this.merges = new Map();
        this.nextId = 256;
        for (let i = 0; i < 256; i++) {
            this.vocabulary.set(i, new Uint8Array([i]));
        }
    }
    async loadExisting(customVocabPath, customMergesPath) {
        try {
            const vocabPath = customVocabPath || path.resolve(__dirname, "vocab.json");
            const mergesPath = customMergesPath || path.resolve(__dirname, "merges.json");
            const vocabData = JSON.parse(await readFile(vocabPath, "utf8"));
            const mergesData = JSON.parse(await readFile(mergesPath, "utf8"));
            this.vocabulary = new Map(Object.entries(vocabData).map(([k, v]) => [
                Number(k),
                new Uint8Array(v),
            ]));
            this.merges = new Map(Object.entries(mergesData));
            this.nextId = Math.max(...this.vocabulary.keys()) + 1;
            console.log("Loaded existing tokenizer. NextId:", this.nextId);
        }
        catch {
            console.log("No existing tokenizer found. Starting fresh.");
        }
    }
    createNewTokenId() {
        return this.nextId++;
    }
    countPairs(tokens) {
        const pairFreq = new Map();
        for (let i = 0; i < tokens.length - 1; i++) {
            const key = `${tokens[i]}-${tokens[i + 1]}`;
            pairFreq.set(key, (pairFreq.get(key) ?? 0) + 1);
        }
        return pairFreq;
    }
    getMostFrequentPair(pairFreq) {
        let maxVal = -Infinity;
        let maxKey = null;
        for (const [key, value] of pairFreq) {
            if (value > maxVal) {
                maxVal = value;
                maxKey = key;
            }
        }
        return maxKey;
    }
    mergePairs(token, bestPairs, id) {
        const pairArr = bestPairs.split("-").map((pair) => Number(pair));
        const newToken = [];
        let i = 0;
        while (i < token.length) {
            if (i < token.length - 1 &&
                token[i] === pairArr[0] &&
                token[i + 1] === pairArr[1]) {
                newToken.push(id);
                i += 2;
            }
            else {
                newToken.push(token[i]);
                i++;
            }
        }
        return newToken;
    }
    async train(text, target, customVocabPath, customMergesPath) {
        let token = Array.from(encode(text));
        while (this.nextId < target) {
            if (this.nextId % 100 === 0) {
                console.log("Current vocab size:", this.nextId);
            }
            // Train one step
            const pairFreq = this.countPairs(token);
            const bestPair = this.getMostFrequentPair(pairFreq);
            if (!bestPair)
                break;
            const newId = this.createNewTokenId();
            const pairArr = bestPair.split("-").map(Number);
            const token1Bytes = this.vocabulary.get(pairArr[0]);
            const token2Bytes = this.vocabulary.get(pairArr[1]);
            const mergedBytes = new Uint8Array(token1Bytes.length + token2Bytes.length);
            mergedBytes.set(token1Bytes, 0);
            mergedBytes.set(token2Bytes, token1Bytes.length);
            this.vocabulary.set(newId, mergedBytes);
            this.merges.set(bestPair, newId);
            token = this.mergePairs(token, bestPair, newId);
        }
        const vocabPath = customVocabPath || path.resolve(__dirname, "vocab.json");
        const mergesPath = customMergesPath || path.resolve(__dirname, "merges.json");
        await writeFile(vocabPath, JSON.stringify(Object.fromEntries([...this.vocabulary.entries()].map(([k, v]) => [k, Array.from(v)])), null, 2));
        await writeFile(mergesPath, JSON.stringify(Object.fromEntries(this.merges), null, 2));
        return token;
    }
}
