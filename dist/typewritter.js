let writers = [];
class typewriter {
    elm;
    in_progress;
    constructor(elm) {
        // if (writers.map(w => w.elm).includes(elm)) {
        //   return writers.find(w => w.elm === elm);
        // }
        this.elm = elm;
        this.in_progress = false;
        writers.push(this);
    }
    /**
    * @param end The text to end up at (uses the current value if empty)
    * @param time How long to take to complete the whole cycle (in ms)
    */
    start(end = "", time = 5000) {
        if (this.in_progress) {
            return;
        }
        if (end.length == 0) {
            end = this.elm.innerText;
        }
        this.elm.innerText = "";
        this.in_progress = true;
        this.loop(end, 1, time / end.length);
    }
    ;
    loop(string, length, timeout) {
        this.elm.innerText = string.substring(0, length);
        if (length < string.length) {
            setTimeout(() => {
                this.loop(string, length + 1, timeout);
            }, timeout + Math.random());
            return;
        }
        this.in_progress = false;
    }
    ;
}
export { typewriter };
//# sourceMappingURL=typewritter.js.map