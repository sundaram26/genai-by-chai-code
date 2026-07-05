import { readFile } from "fs/promises";
import * as path from "path";
import { BPETokenizer } from "../src/trainer";

async function trainTokenizer() {
    const trainer = new BPETokenizer();

    const vocabPath = path.resolve(__dirname, "../src/vocab.json");
    const mergesPath = path.resolve(__dirname, "../src/merges.json");
    const corpusPath = path.resolve(__dirname, "./corpus.txt");

    await trainer.loadExisting(vocabPath, mergesPath);

    const text: string = await readFile(corpusPath, "utf-8");

    console.log("Corpus Loaded...", "size: ", text.length);
    
    const targetVocab = 2000;

    console.log("Training Tokenizer...");
    const start = Date.now();

    await trainer.train(text, targetVocab, vocabPath, mergesPath);

    const end = Date.now();

    console.log("Training Completed");
    console.log("Time: ", (end - start) / 1000, "sec");
}

trainTokenizer();
