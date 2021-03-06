const forthTrue = -1;
const forthFalse = 0;

function stack() {
    return {
        stack: [],
        push: function (x) { return this.stack.push(x) },
        pop: function () {
            const x = this.stack.pop();
            if (x === undefined) {
                console.log('Stack underflow');
            }
            return x;
        },

        peek: function (offset) {
            return this.stack[this.stack.length - offset];
        },

        append: function (what) {
            if (Array.isArray(what)) {
                this.stack = this.stack.concat(what);
            }
            else {
                this.push(what);
            }
        },
        depth: function () { return this.stack.length; }
    }
}

function dictionary() {
    return {
        dictionary: [],
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
        addWord: function (name, code, immediate = false) {
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
    }
}

function createInitialState() {
    return {
        stack: stack(),
        returnStack: stack(),
        dictionary: dictionary(),
        memory: [],
        input: undefined, //parser state
        currentSymbolName: undefined, //parser state,
        isCompileMode: false,
        currentCompileSymbol: stack(), //word currently compiled
        currentExecutingWord: undefined,
        jumpStack: stack(),
        currentAddress: undefined,
        ifStack: stack(),

        push: function (x) { return this.stack.push(x) },
        pop: function () { return this.stack.pop(); },

        addWord: function (name, code, immediate = false) { return this.dictionary.addWord(name, code, immediate); },

        evaluateLine: function (line, printOk = true) {
            this.input = line;
            while (this.input !== undefined) {
                let nextToken = this.getNextInputWord();
                if (nextToken === undefined) {
                    break;
                }
                if (!this.evaluateToken(nextToken)) {
                    return;
                }
            }
            if (printOk === true) {
                console.log(' ok');
            }
        },

        evaluateToken: function (token) {
            if (this.isCompileMode) {
                return this.compileToken(token);
            } else {
                return this.interpretToken(token);
            }
        },

        interpretToken: function (token) {
            //When the interpreter finds a word, it looks the word up in the dictionary.
            if (this.callWord(token)) {
                return true;
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
        compileToken: function (token) {
            //When the interpreter finds a word, it looks the word up in the dictionary.
            const word = this.dictionary.findWord(token);
            if (word !== undefined) {
                if (word.immediate) {
                    //execute immediate words
                    this.executeWord(word);
                } else {
                    // compile a definition for this word
                    let xt = this.getExecutionToken(token);
                    // this.compileNextCall(state=>state.executeWord(xt));
                    this.compileNextCall(word.code);
                }
                return true;
            }
            //If the word isn't found, the word is assumed to be a number and an attempt is made to convert it into a number and push it on the stack;
            const parsed = parseInt(token);
            if (isNaN(parsed)) {
                console.log(token + ' ?');
                return false;
            } else {
                //push the code to push the number to the stack
                this.compileNextCall(state => state.push(parsed));
            }
            return true;
        },
        compileTokens: function (tokens) { for (const token of tokens) this.compileToken(token); },
        compileNextCall: function (code) {
            let currentSymbol = this.currentFunctionBody();
            let jumpOffset = currentSymbol.depth();
            if (Array.isArray(code)) {
                //offset jump addresses
                for (let instruction of code) {
                    if (typeof (instruction) == 'number') {
                        currentSymbol.append(instruction + jumpOffset);
                    }
                    else {
                        currentSymbol.append(instruction);
                    }
                }
            }
            else {
                currentSymbol.append(code);
            }
        },
        currentFunctionAddress: function () {
            return this.currentFunctionBody().depth() - 1;
        },
        nextFunctionAddress: function () {
            return this.currentFunctionBody().depth();
        },
        currentFunctionBody: function () {
            return this.currentCompileSymbol;
        },
        getNextInputWord: function () {
            return this.getNextDelimitedWord(' ');
        },
        getNextDelimitedWord: function (delimiter) {
            //trim leading spaces
            if (this.input === undefined) {
                return '';
            }
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
        getExecutionToken: function (name) {
            const word = this.dictionary.findWord(name);
            if (word === undefined) {
                return undefined;
            }
            return word; //TODO or wrapped word
        },
        ensureCompileMode: function () {
            if (!this.isCompileMode) {
                console.log('Interpreting a compile-only word');
            }
            return this.isCompileMode;
        },
        makeVariable: function (name) {
            this.memory.push(0);
            let index = this.memory.length - 1;
            this.addWord(name, state => state.push(index));
        },
        reset: function () {
            this.stack = stack();
            this.memory = stack();
            this.makeVariable('state');
        },
        callWord: function (wordName) {
            const word = this.dictionary.findWord(wordName);
            if (word !== undefined) {
                //If the word is found, the interpreter executes the code associated with the word, and then returns to parse the rest of the input stream. 
                this.executeWord(word);
                return true;
            }
            return false;
        },
        executeWord: function (word) {
            if (!Array.isArray(word.code)) {
                console.log('Unexpected format of code for word ' + word + '!');
            }
            this.currentExecutingWord = word;
            let addr = 0;
            while (addr < word.code.length) {
                this.currentAddress = addr;
                word.code[addr](this);
                //check if we manipulated the current address
                if (this.currentAddress === addr) {
                    addr++;
                }
                else {
                    addr = this.currentAddress;
                }
            }
        },
        allot: function (cells) {
            let newCells = [...Array(cells)].map(_ => 0);
            this.memory.push(...newCells);
        },
        startNewWordDefininion: function (name) {
            if (this.isCompileMode) {
                console.log('Cannot have nested definitions with :');
                return;
            }
            this.isCompileMode = true;
            this.currentCompileSymbol = stack();
            this.currentSymbolName = name;
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
    state.addWord('.s', (state) => console.log(state.stack.stack));
    state.addWord('.r', (state) => console.log(state.returnStack.stack));
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
    state.addWord('<=', (state) => {
        state.push(booleanToForthFlag(state.pop() >= state.pop()));
    });
    state.addWord('>=', (state) => {
        state.push(booleanToForthFlag(state.pop() <= state.pop()));
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
    state.addWord('invert', state => state.push(~state.pop()));
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
    //comment word
    state.addWord('(', state => {
        let word = state.getNextDelimitedWord(')');
        //do nothing - discard word
    }, true);

    state.addWord('see', state => {
        let nextWord = state.getNextInputWord();
        let word = state.dictionary.findWord(nextWord);
        if (word == undefined) {
            throw 'undefined word';
        }
        for (let f of word.code) {
            console.log(f.toString());
        }
    });

    state.addWord('.\"', state => {
        let word = state.getNextDelimitedWord('\"');
        if (state.isCompileMode) {
            state.compileNextCall((state) => print(word))
        }
        else {
            print(word);
        }
    }, true);

    state.addWord(':', state => {
        let name = state.getNextInputWord();
        state.startNewWordDefininion(name);
    });
    state.addWord(':noname', state => {
        state.startNewWordDefininion('');
    });

    //NONSTANDARD
    state.addWord('??', (state) => console.log(state.dictionary.dictionary));
    state.addWord('???', (state) => console.log(state.memory.stack));

    // compile mode tokens
    state.addWord(';', state => {
        if (!state.ensureCompileMode()) { return; }

        let wasAnonymousWord = state.currentSymbolName === '';
        let currentSymbolCode = state.currentFunctionBody();
        let xt = state.addWord(state.currentSymbolName, currentSymbolCode.stack);
        state.currentSymbolName = undefined;
        state.isCompileMode = false;
        if (wasAnonymousWord) {
            state.push(xt);
        }
    }, true);

    state.addWord('here', state => {
        state.jumpStack.push(state.currentAddress);
    })
    state.addWord('allot', state => {
        state.allot(state.pop());
    });
    state.addWord('i', state => {
        state.push(state.returnStack.peek(2));
    });
    state.addWord('j', state => {
        state.push(state.returnStack.peek(4));
    });
    state.addWord('depth', state => {
        state.push(state.stack.length);
    })
    state.addWord('pick', state => {
        let offset = state.pop();
        state.push(state.stack[state.stack.length - offset - 1]);
    });
    state.addWord('branch', state => {
        //jump, destination is in the targetAddress of this function
        //read the argument off the function       
        let targetAddress = state.currentExecutingWord.code[state.currentAddress + 1];
        state.currentAddress += 2;
        state.currentAddress = targetAddress;
    });
    state.addWord('0branch', state => {
        let targetAddress = state.currentExecutingWord.code[state.currentAddress + 1];
        state.currentAddress += 2;
        let top = state.pop();
        if (top == 0) {
            state.currentAddress = targetAddress;
        }
    });
    state.addWord('noop', state => { });
    state.addWord('if', state => {
        if (!state.ensureCompileMode()) { return; }
        state.compileToken('0branch');
        //compile a dummy address to be replaced by the actual address in else/then
        state.compileNextCall(0);
        //push current address on the stack to be picked up by else / then as a forward reference
        state.push(state.currentFunctionAddress());
    }, true);
    state.addWord('else', state => {
        // compile a jump to then
        state.compileToken('branch');
        //compile a dummy address to be replaced by the actual address in then
        state.compileNextCall(0);
        //fix the previous 'if' word with a 0branch to else
        let elseAddress = state.currentFunctionAddress();
        let previousJumpAddress = state.pop();
        let currentFunctionBody = state.currentFunctionBody();
        let elseBodyAddress = elseAddress + 1;
        currentFunctionBody.stack[previousJumpAddress] = elseBodyAddress; //elseAddress points to the jump address
        //push current address on the stack to be picked up by then as a forward reference
        state.push(elseAddress);
    }, true);

    state.addWord('then', state => {
        if (!state.ensureCompileMode()) { return; }
        //compile a no-op as a jump target
        state.compileToken('noop');
        //patch the previous 'if' / 'else' word:
        let currentFunctionBody = state.currentFunctionBody();
        let thenAddress = state.currentFunctionAddress();
        //find the previous 0branch by if (or branch by else) and patch its offset
        let previousJumpAddress = state.pop();
        currentFunctionBody.stack[previousJumpAddress] = thenAddress;

    }, true);
    state.addWord('begin', state => {
        if (!state.ensureCompileMode()) { return; }
        //generate a branch placeholder
        state.callWord('(pushaddress)');
    }, true);
    state.addWord('until', state => {
        if (!state.ensureCompileMode()) {
            return;
        }
        let targetAddress = state.pop();
        state.compileNextCall(state => {
            let condition = state.pop();
            if (condition == forthTrue) {
                return;
            }
            //generate a jump back
            state.currentAddress = targetAddress;
        });
    }, true);
    state.addWord('again', state => {
        if (!state.ensureCompileMode()) { return; }
        let targetAddress = state.pop();
        state.compileNextCall(state => {
            //generate a jump back
            state.currentAddress = targetAddress;
        });
    }, true);
    state.addWord('(pushaddress)', state => {
        state.push(state.nextFunctionAddress());
    }, true);
    state.addWord('do', state => {
        if (!state.ensureCompileMode()) { return; }
        state.compileToken('(do)');
        //compile address placeholder for the do
        state.callWord('(pushaddress)');
    }, true);
    state.addWord('loop', state => {
        if (!state.ensureCompileMode()) { return; }
        let targetAddress = state.pop();
        //pop loop counter and limit from return stack, jump back (and prepare return stack) if we need to loop again
        state.compileTokens('r> r> 1+ 2dup > if >r >r branch'.split(' '));
        //add adress of the 'do' as the jump target
        state.compileNextCall(targetAddress);
        //clean up the stack otherwise
        state.compileTokens('else drop drop then'.split(' '));
    }, true);
    state.addWord('words', state => {
        let seenWords = new Set();
        for (let word of state.dictionary.dictionary) {
            if (word.name !== '' && !seenWords.has(word.name)) {
                seenWords.add(word.name);
                print(word.name + ' ');
            }
        }
    });
    // state.addWord(',', state => {
    //     //append top of the stack to the next cell of the dictionary
    //     let tos = state.pop();
    //     //append it to ... top word code? variable?
    // }
    // });
    // state.addWord('compile-only-error', state=>{

    // })
}

function initializeForthWords(state) {
    let initCode = `
    -1 constant true
    0 constant false
    : ? ( addr -- ) @ . ;
    : 1+ ( n1 -- n2 ) 1 + ;
    : 1- ( n1 -- n2 ) 1 - ;
    : 1+ ( n1 -- n2 ) 1 + ;
    : 1- ( n1 -- n2 ) 1 - ;
    : 2+ ( n1 -- n2 ) 2 + ;
    : 2- ( n1 -- n2 ) 2 - ;
    : 2* ( n1 -- n2 ) 2 * ;
    : 2/ ( n1 -- n2 ) 2 / ;
    : 2drop ( n1 n2 -- ) drop drop ;
    : 2dup ( n1 n2 -- n1 n2 n1 n2 ) over over ;
    : nip ( n1 n2 -- n2 ) swap drop ;
    : 0< ( n -- flag ) 0 < ;
    : 0> ( n -- flag ) 0 > ;
    : 0= ( n -- flag ) 0 = ;
    13 constant newline
    : cr ( -- ) newline emit ;
    : cells 1 * ;
    : cell 1 ;
    : (do) >r >r ;
    : max ( n1 n2 -- n3) 2dup > if drop else nip then ;
    : min ( n1 n2 -- n3) 2dup < if drop else nip then ;
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

var noprompt = false;

function repl() {
    let stdin = process.openStdin();
    let state = createInitialState();
    state.reset();
    initializeBuiltinWords(state);
    initializeForthWords(state);
    if (process.argv.includes('/noprompt')) {
        noprompt = true;
    }
    if (noprompt === false) {
        console.log('? ')
    }

    stdin.addListener("data", function (line) {
        let trimmedLine = line.toString().trim();
        state.evaluateLine(trimmedLine, !noprompt);
    });
}

repl();