import { encode } from "../utils/encoder";
import { Tokenizer } from "../utils/tokenizer";

async function testTokenizer() {
    const tokenizer = new Tokenizer();

    await tokenizer.load();

    // const text = "function hello_world() { return 42 }";
    const text = "The quick brown fox jumps over the lazy dog.";
    // const text = "https://github.com/openai/gpt";
    // const text = "aaaaaaaaaaaaaaaaaaaaaaaaaaaa";
    console.log("Original Text:", text);
    const normalTokens = encode(text);
    console.log("UTF-8 Tokens:", normalTokens);

    const tokens = tokenizer.bpeEncode(text);

    console.log("BPE Tokens:", tokens);

    const decoded = tokenizer.bpeDecode(tokens);

    console.log("Decoded:", decoded);
}

testTokenizer();
