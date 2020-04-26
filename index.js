function createInitialState() {
    return {
        stack: [],
        dictionary: [],
        memory: [],
        input: undefined, //parser state
        currentSymbolCode: undefined, //parser state
        currentSymbolName: undefined, //parser state,
        isCompileMode: false,

        push: function (x) { return this.stack.push(x) },
        pop: function () {
            const x = this.stack.pop();
            if (x === undefined) {
                console.log('Stack underflow');
            }
            return x;
        },

        evaluateLine: function (line) {
            this.input = line;
            while (this.input !== undefined) {
                let nextToken = this.getNextInputWord();
                if (nextToken === undefined) {
                    break;
                }
                if (this.isCompileMode) {
                    this.compileToken(nextToken);
                }
                else {
                    this.interpretToken(nextToken);
                }
            }
            process.stdout.write('\n')
        },

        interpretToken: function (token) {
            if (typeof (token) === 'function') {
                token(state);
                return;
            }
            //When the interpreter finds a word, it looks the word up in the dictionary.
            const word = this.findWord(token);
            if (word !== undefined) {
                //If the word is found, the interpreter executes the code associated with the word, and then returns to parse the rest of the input stream. 
                if (typeof (word.code) === 'function') {
                    word.code(this);
                }
                else {
                    if (Array.isArray(word.code)) {
                        for (f of word.code) {
                            f(this);
                        }
                    }
                    else {
                        console.log('dunno what to do!');
                    }
                    //evaluateTokens(this, word.code);
                }
                return;
            }
            //If the word isn't found, the word is assumed to be a number and an attempt is made to convert it into a number and push it on the stack;
            const parsed = parseInt(token);
            if (isNaN(parsed)) {
                console.log(token + ' ?');
                return false;
            }
            else {
                //push the new token
                this.stack.push(parsed);
            }
            return true;
        },

        //TODO merge with interpretToken (same structure, different 'hooks' of what to do with a word or a symbol)
        compileToken: function (token) {
            //When the interpreter finds a word, it looks the word up in the dictionary.
            const word = this.findWord(token);
            if (word !== undefined) {
                if (word.immediate) {
                    //execute immediate words
                    word.code(this);
                }
                else {
                    // compile a definition for this word
                    let xt = this.getExecutionToken(token);
                    this.currentSymbolCode.push(word.code);
                }
                return;
            }
            //If the word isn't found, the word is assumed to be a number and an attempt is made to convert it into a number and push it on the stack;
            const parsed = parseInt(token);
            if (isNaN(parsed)) {
                console.log(token + ' ?');
                return false;
            }
            else {
                //push the code to push the number to the stack
                this.currentSymbolCode.push((state) => state.push(parsed));
            }
            return true;
        },

        getNextInputWord: function () {
            return this.getNextDelimitedWord(' ');
        },

        getNextDelimitedWord: function (delimiter) {
            //trim leading spaces
            this.input = this.input.trimStart();
            let index = this.input.indexOf(delimiter);
            if (index == -1) {
                index = this.input.length;
            }
            let word = this.input.substring(0, index);
            if (this.input.length > index + 1)
                this.input = this.input.substring(index + 1);
            else
                this.input = undefined;
            return word;
        },

        addWord: function (name, code, immediate = false) {
            word = {
                name: name,
                code: code,
                immediate: immediate
            };
            this.dictionary.unshift(word);
        },
        getExecutionToken: function (name) {
            const word = this.findWord(name);
            if (word === undefined) {
                return undefined;
            }
            return word; //TODO or wrapped word
        },
        findWord: function (name) {
            //forwards as we unshift the new definitions
            for (let word of this.dictionary) {
                //If the word is found, the interpreter executes the code associated with the word, and then returns to parse the rest of the input stream. 
                if (word.name == name) {
                    return word;
                }
            }
            return undefined;
        },
        execute: function (word) {
            if (typeof (word.code) === 'function') {
                word.code(this);
            }
            else {
                evaluateTokens(this, word.code);
            }
        },
        ensureCompileMode: function () {
            if (!this.isCompileMode) {
                console.log('Interpreting a compile-only word');
            }
            return this.isCompileMode;
        }
    };
}

function initializeBuiltinWords(state) {
    //a word prototype just operates on the stack 
    state.addWord('+', (s) => {
        state.push(state.pop() + state.pop())
    });
    state.addWord('-', (s) => {
        let b = state.pop();
        let a = state.pop();
        state.push(a - b);
    });
    state.addWord('*', (s) => {
        state.push(state.pop() * state.pop())
    });
    state.addWord('/', (s) => {
        let b = state.pop();
        let a = state.pop();
        state.push(Math.floor(a / b));
    });
    state.addWord('.', (s) => {
        let value = state.pop();
        if (value === undefined) {
            return;
        }
        process.stdout.write(value.toString());
        process.stdout.write(' ');
    });
    state.addWord('dup', (s) => {
        let x = state.pop();
        state.push(x);
        state.push(x);
    });

    state.addWord('drop', (s) => { state.pop() });
    state.addWord('swap', (s) => {
        let x2 = state.pop();
        let x1 = state.pop();
        state.push(x2);
        state.push(x1);
    });
    state.addWord('over', (s) => {
        let x2 = state.pop();
        let x1 = state.pop();
        state.push(x1);
        state.push(x2);
        state.push(x1);
    });
    state.addWord('rot', (s) => {
        let x3 = state.pop();
        let x2 = state.pop();
        let x1 = state.pop();
        state.push(x2);
        state.push(x3);
        state.push(x1);
    });
    state.addWord('emit', (s) => {
        let c = state.pop();
        process.stdout.write(String.fromCharCode(c));
    });
    state.addWord('cr', (state) => process.stdout.write('\n'));
    state.addWord('.s', (state) => console.log(state.stack));
    state.addWord('execute', (state) => {
        let word = state.pop();
        state.execute(word);
    });
    state.addWord('>', (state) => {
        state.push(booleanToForthFlag(state.pop() < state.pop()));
    });
    state.addWord('<', (state) => {
        state.push(booleanToForthFlag(state.pop() > state.pop()));
    });
    state.addWord('=', (state) => {
        state.push(booleanToForthFlag(state.pop() == state.pop()));
    });
    state.addWord('and', (state) => {
        state.push(booleanToForthFlag(state.pop() && state.pop()));
    });
    state.addWord('or', (state) => {
        state.push(booleanToForthFlag(state.pop() || state.pop()));
    });
    state.addWord('xor', (state) => {
        state.push(booleanToForthFlag(state.pop() ^ state.pop()));
    });
    state.addWord('invert', state => state.push(~state.pop()));// (state) => state.push(state.pop() * -1 - 1)); // : invert -1 * -1 - ;
    state.addWord('mod', state => {
        let a = state.pop();
        let b = state.pop();
        state.push(b % a);
    })

    state.addWord('constant', (state) => {
        let nextWord = state.getNextInputWord();
        let value = state.pop();
        state.addWord(nextWord, state => state.push(value));
    });
    state.addWord('variable', (state) => {
        let nextWord = state.getNextInputWord();
        state.memory.push(0);
        let index = state.memory.length - 1;
        state.addWord(nextWord, state => state.push(index));
    });
    state.addWord('\'', state => {
        let nextWord = state.getNextInputWord();
        let xt = state.getExecutionToken(nextWord);
        if (xt !== undefined) {
            state.push(xt);
        }
    });
    //store a value at an address
    state.addWord('!', (state) => {
        let address = state.pop();
        let value = state.pop();
        state.memory[address] = value;
    });
    state.addWord('@', state => {
        let address = state.pop();
        state.push(state.memory[address]);
    });

    state.addWord('+!', state => {
        //TODO could be implemented in forth?
        let address = state.pop();
        let value = state.pop();
        state.memory[address] += value;
    });
    //state.addWord('+!', ['dup', '@', 'rot', '+', 'swap', '!' ])
    // : +! ( n addr -- ) dup @ rot + swap !

    //comment word
    state.addWord('(', state => {
        let word = state.getNextDelimitedWord(')');
        //do nothing - discard word
    });

    state.addWord('see', state => {
        let nextWord = state.getNextInputWord();
        let word = state.findWord(nextWord);
        console.log(word.code);
    });

    state.addWord('.\"', state => {
        let word = state.getNextDelimitedWord('\"');
        print(word);
    });

    state.addWord(':', state => {
        if (state.isCompileMode) {
            console.log('Cannot have nested definitions with :');
            return;
        }
        state.isCompileMode = true;
        state.currentSymbolCode = [];
        let name = state.getNextInputWord();
        state.currentSymbolName = name;
    });

    
    //state.addWord('invert', (state) => state.push(state.pop() * -1 - 1)); // : invert -1 * 1 - ;
    // state.addWord('invert', ['-1', '*', '1', '-'])
    //NONSTANDARD
    state.addWord('??', (state) => console.log(state.words));
    state.addWord('???', (state) => console.log(state.memory));

    // compile mode tokens
    state.addWord(';', state => {
        if (!state.ensureCompileMode()) {
            return;
        }

        state.addWord(state.currentSymbolName, state.currentSymbolCode);
        state.currentSymbolCode = undefined;
        state.currentSymbolName = undefined;
        state.isCompileMode = false;
    }, true);
}

function initializeForthWords(state) {
    let initCode = `
    -1 constant true
    0 constant false
    : 1+ 1 + ;
    : 1- 1 - ;
    : ? @ . ;
    : 1+   1 + ;
    : 1-   1 - ;
    : 2+   2 + ;
    : 2-   2 - ;
    : 2*   2 * ;
    : 2/   2 / ;
    : 2drop drop drop ;
    : 2dup dup dup ;
    : 0<   0 < ;
    : 0>   0 > ;
    : 0=   0 = ;
    `;
    for(line of initCode.split('\n')){
        state.evaluateLine(line.trim());
    }
}

function print(x) {
    process.stdout.write(x);
}

function booleanToForthFlag(boolean) {
    return boolean ? -1 : 0;
}

function evaluateTokens(state, tokens) {
    while (tokens.length > 0) {
        if (evaluateToken(state, tokens) === false)
            break;
    }
}

function canAccept(state, token) {
    if (token in state.words) {
        return true;
    }
    const parsed = parseInt(token);
    if (isNaN(parsed)) {
        console.log(token + ' ?');
        return false;
    }
    else {
        return true;
    }
}

function repl() {
    let stdin = process.openStdin();
    let state = createInitialState();
    initializeBuiltinWords(state);
    initializeForthWords(state);
    if (process.argv.includes('/noprompt') === false) {
        console.log('? ')
    }

    stdin.addListener("data", function (line) {
        let trimmedLine = line.toString().trim();
        state.evaluateLine(trimmedLine);
    });
}

repl();
