import { readFile } from "fs/promises";
import { BPETokenizer } from "../utils/trainer";


async function trainTokenizer() {
    const trainer = new BPETokenizer();

    await trainer.loadExisting();

    const text: string = await readFile(
      "src/features/tokenizer/training-data/corpus.txt",
      "utf-8",
    );

    console.log("Corpus Loaded...", "size: ", text.length)
    
    const targetVocab = 2000;

    console.log("Training Tokenizer...")
    const start = Date.now();

    await trainer.train(text, targetVocab);

    const end = Date.now()

    console.log("Training Completed");
    console.log("Time: ", (end - start) / 1000, "sec");
}

trainTokenizer();