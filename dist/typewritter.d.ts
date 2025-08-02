declare class typewriter {
    elm: HTMLDivElement;
    in_progress: boolean;
    constructor(elm: HTMLDivElement);
    /**
    * @param end The text to end up at (uses the current value if empty)
    * @param time How long to take to complete the whole cycle (in ms)
    */
    start(end?: String, time?: number): void;
    loop(string: String, length: number, timeout: number): void;
}
export { typewriter };
//# sourceMappingURL=typewritter.d.ts.map