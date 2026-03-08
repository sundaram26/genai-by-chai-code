import { Tokenizer } from "../utils/tokenizer";

async function testTokenizer() {
    const tokenizer = new Tokenizer();

    await tokenizer.load();

    const text = "function hello_world() { return 42 }";

    const tokens = tokenizer.bpeEncode(text);

    console.log("Tokens:", tokens);

    const decoded = tokenizer.bpeDecode(tokens);

    console.log("Decoded:", decoded);
}

testTokenizer();
