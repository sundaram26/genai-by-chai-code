
export class BPETokenizer {
    private vocabulary: Map<number, Uint8Array>
    private merges: Map<string, number>
    private nextId: number

    constructor() {
        this.vocabulary = new Map()
        this.merges = new Map()
        this.nextId = 256
    }
    
    createNewTokenId(): number {
        const id = this.nextId;
        this.nextId++;
        return id;
    }
}
