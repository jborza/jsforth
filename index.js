function createInitialState() {
    return {
        stack: [],
        returnStack: [],
        dictionary: [],
        memory: [],
        input: undefined, //parser state
        currentSymbolCode: undefined, //parser state
        currentSymbolName: undefined, //parser state,
        isCompileMode: false,

        push: function(x) { return this.stack.push(x) },
        pop: function() {
            const x = this.stack.pop();
            if (x === undefined) {
                console.log('Stack underflow');
            }
            return x;
        },

        peek: function(offset, stack) {
            return stack[stack.length - offset];
        },

        evaluateLine: function(line, printLF = true) {
            this.input = line;
            while (this.input !== undefined) {
                let nextToken = this.getNextInputWord();
                if (nextToken === undefined) {
                    break;
                }
                this.evaluateToken(nextToken);
            }
            if (printLF) {
                process.stdout.write('\n')
            }
        },

        evaluateToken: function(token) {
            if (this.isCompileMode) {
                this.compileToken(token);
            } else {
                this.interpretToken(token);
            }
        },

        interpretToken: function(token) {
            //When the interpreter finds a word, it looks the word up in the dictionary.
            if (this.callWord(token)) {
                return;
            }
            //If the word isn't found, the word is assumed to be a number and an attempt is made to convert it into a number and push it on the stack;
            const parsed = parseInt(token);
            if (isNaN(parsed)) {
                console.log(token + ' ?');
                return false;
            } else {
                //push the new token
                this.stack.push(parsed);
            }
            return true;
        },

        //TODO merge with interpretToken (same structure, different 'hooks' of what to do with a word or a symbol)
        compileToken: function(token) {
            //When the interpreter finds a word, it looks the word up in the dictionary.
            const word = this.findWord(token);
            if (word !== undefined) {
                if (word.immediate) {
                    //execute immediate words
                    this.executeWord(word);
                } else {
                    // compile a definition for this word
                    let xt = this.getExecutionToken(token);
                    this.currentSymbolCode = this.currentSymbolCode.concat(word.code);
                }
                return;
            }
            //If the word isn't found, the word is assumed to be a number and an attempt is made to convert it into a number and push it on the stack;
            const parsed = parseInt(token);
            if (isNaN(parsed)) {
                console.log(token + ' ?');
                return false;
            } else {
                //push the code to push the number to the stack
                this.currentSymbolCode.push((state) => state.push(parsed));
            }
            return true;
        },

        getNextInputWord: function() {
            return this.getNextDelimitedWord(' ');
        },

        getNextDelimitedWord: function(delimiter) {
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

        addWord: function(name, code, immediate = false) {
            let wordCode = [];
            wordCode = wordCode.concat(code);
            word = {
                name: name,
                code: wordCode,
                immediate: immediate
            };
            this.dictionary.unshift(word);
            return word;
        },
        getExecutionToken: function(name) {
            const word = this.findWord(name);
            if (word === undefined) {
                return undefined;
            }
            return word; //TODO or wrapped word
        },
        findWord: function(name) {
            //forwards as we unshift the new definitions
            for (let word of this.dictionary) {
                //If the word is found, the interpreter executes the code associated with the word, and then returns to parse the rest of the input stream. 
                if (word.name == name) {
                    return word;
                }
            }
            return undefined;
        },
        ensureCompileMode: function() {
            if (!this.isCompileMode) {
                console.log('Interpreting a compile-only word');
            }
            return this.isCompileMode;
        },
        makeVariable: function(name) {
            this.memory.push(0);
            let index = this.memory.length - 1;
            this.addWord(name, state => state.push(index));
        },
        reset: function() {
            this.stack = [];
            this.memory = [];
            this.makeVariable('state');
        },
        callWord: function(wordName) {
            const word = this.findWord(wordName);
            if (word !== undefined) {
                //If the word is found, the interpreter executes the code associated with the word, and then returns to parse the rest of the input stream. 
                this.executeWord(word);
                return true;
            }
            return false;
        },
        executeWord: function(word) {
            if (Array.isArray(word.code)) {
                for (f of word.code) {
                    f(this);
                }
            } else {
                console.log('Unexpected format of code for word ' + word + '!');
            }
        },
        allot: function(cells) {
            let newCells = [...Array(cells)].map(_ => 0);
            this.memory.push(...newCells);
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
    state.addWord('.s', (state) => console.log(state.stack));
    state.addWord('.r', (state) => console.log(state.returnStack));
    state.addWord('r>', state => state.stack.push(state.returnStack.pop()));
    state.addWord('>r', state => state.returnStack.push(state.stack.pop()));
    state.addWord('execute', (state) => {
        let word = state.pop();
        state.executeWord(word);
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
    state.addWord('invert', state => state.push(~state.pop())); // (state) => state.push(state.pop() * -1 - 1)); // : invert -1 * -1 - ;
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
        state.makeVariable(nextWord);
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
        if(state.isCompileMode){
            state.currentSymbolCode.push((state) => print(word));
        }
        else{
            print(word);
        }
    }, true);

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
    state.addWord(':noname', state => {
        if (state.isCompileMode) {
            console.log('Cannot have nested definitions with :');
            return;
        }
        state.isCompileMode = true;
        state.currentSymbolCode = [];
        state.currentSymbolName = '';
    });

    // state.addWord('invert', (state) => state.push(state.pop() * -1 - 1)); // : invert -1 * 1 - ;
    // state.addWord('invert', ['-1', '*', '1', '-'])
    //NONSTANDARD
    state.addWord('??', (state) => console.log(state.dictionary));
    state.addWord('???', (state) => console.log(state.memory));

    // compile mode tokens
    state.addWord(';', state => {
        if (!state.ensureCompileMode()) {
            return;
        }

        let wasAnonymousWord = state.currentSymbolName === '';
        let xt = state.addWord(state.currentSymbolName, state.currentSymbolCode);
        state.currentSymbolCode = undefined;
        state.currentSymbolName = undefined;
        state.isCompileMode = false;
        if(wasAnonymousWord)
        {
            state.push(xt);
        }
    }, true);
    state.addWord('if', state => {
        if (!state.ensureCompileMode()) {
            return;
        }
        //do stuff until else or then
        let condition = state.pop();
    })
    state.addWord('here', state => {
        state.push(state.memory.length);
    })
    state.addWord('allot', state => {
        state.allot(state.pop());
    });
    state.addWord('i', state => {
        state.push(state.peek(1, returnStack));
    });
    state.addWord('j', state => {
        state.push(state.peek(2, returnStack));
    });
    state.addWord('create', state => {
        //???
        let nextWord = state.getNextInputWord();
        //similar to this.addWord()
        state.addWord(nextWord, []);
        // It does fill in the code for the newly-created word with standard boilerplate code that 
        // pushes an aligned address on the stack and simply returns
    });
    // state.addWord(',', state => {
    //     //append top of the stack to the next cell of the dictionary
    //     let tos = state.pop();
    //     //append it to ... top word code?

    // });
    // state.addWord('compile-only-error', state=>{

    // })
}

function initializeForthWords(state) {
    let initCode = `
    -1 constant true
    0 constant false
    : 1+ 1 + ;
    : 1- 1 - ;
    : ? @ . ;
    : 1+ 1 + ;
    : 1- 1 - ;
    : 2+ 2 + ;
    : 2- 2 - ;
    : 2* 2 * ;
    : 2/ 2 / ;
    : 2drop drop drop ;
    : 2dup over over ;
    : nip swap drop ;
    : 0< 0 < ;
    : 0> 0 > ;
    : 0= 0 = ;
    13 constant newline
    : cr newline emit ;
    : cells 1 * ;
    : cell 1 ;
    `;
    for (line of initCode.split('\n')) {
        if (line.trim().length == 0)
            continue;
        state.evaluateLine(line.trim(), false);
    }
}

function print(x) {
    process.stdout.write(x);
}

function booleanToForthFlag(boolean) {
    return boolean ? -1 : 0;
}

function repl() {
    let stdin = process.openStdin();
    let state = createInitialState();
    state.reset();
    initializeBuiltinWords(state);
    initializeForthWords(state);
    if (process.argv.includes('/noprompt') === false) {
        console.log('? ')
    }

    stdin.addListener("data", function(line) {
        let trimmedLine = line.toString().trim();
        state.evaluateLine(trimmedLine);
    });
}

repl();