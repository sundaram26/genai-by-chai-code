import * as path from "path";
import { encode } from "../src/encoder";
import { Tokenizer } from "../src/tokenizer";
async function testTokenizer() {
    const tokenizer = new Tokenizer();
    const vocabPath = path.resolve(__dirname, "../src/vocab.json");
    const mergesPath = path.resolve(__dirname, "../src/merges.json");
    await tokenizer.load(vocabPath, mergesPath);
    const text = "The quick brown fox jumps over the lazy dog.";
    console.log("Original Text:", text);
    const normalTokens = encode(text);
    console.log("UTF-8 Tokens:", normalTokens);
    const tokens = tokenizer.bpeEncode(text);
    console.log("BPE Tokens:", tokens);
    const decoded = tokenizer.bpeDecode(tokens);
    console.log("Decoded:", decoded);
}
testTokenizer();
