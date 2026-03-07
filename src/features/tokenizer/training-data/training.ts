import { readFile } from "fs/promises";


function trainTokenizer() {
    const text = readFile("./corpus.txt", "utf-8");
}