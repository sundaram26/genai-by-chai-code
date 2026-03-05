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
        return [];
    }

}
