function createInitialState() {
    return {
        stack: [],
        dictionary: [],
        memory: [],
        input: undefined,

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
                this.evaluateToken(nextToken);
            }
            process.stdout.write('\n')
        },

        evaluateToken: function (token) {
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
                    evaluateTokens(this, word.code);
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

        getNextInputWord: function () {
            return this.getNextDelimitedWord(' ');
        },

        getNextDelimitedWord: function (delimiter) {
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

        addWord: function (name, code) {
            word = {
                name: name,
                code: code
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
        process.stdout.write(state.pop().toString());
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
        //TODO implement
    });
    state.addWord('variable', (state) => {

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

    //comment word
    state.addWord('(', state => {
        let word = state.getNextDelimitedWord(')');
        //discard word;
    });


    state.addWord('?', ['@', '.']); //? is defined as @ .
    //state.addWord('invert', (state) => state.push(state.pop() * -1 - 1)); // : invert -1 * 1 - ;
    state.addWord('invert', ['-1', '*', '1', '-'])
    //NONSTANDARD
    state.addWord('??', (state) => console.log(state.words));
    state.addWord('???', (state) => console.log(state.memory));
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

function evaluateWordDefinition(state, tokens) {
    //TODO convert to a function
    //TODO conditionals: if ... then | if ... else ... then
    // -  Conditionals in Forth can only be used inside definitions. 
    //DO .. LOOP: remember that the words DO and LOOP are branching commands and that therefore they can only be executed inside a definition.
    //+LOOP pops the increment from the stack, e.g. 0 10 do i . -1 +loop
    //eat words and store a function definition
    let body = [];
    let name = tokens.shift();
    if (name == undefined)
        return;
    while (tokens.length > 0) {
        let token = tokens.shift();
        if (token == ';') {
            //end word definition
            state.addWord(name, body);
            return;
        }
        let word = state.getExecutionToken(token);
        if (word !== undefined) {
            //pick up the execution token
            body.push(word.code);
            continue;
        }
        //pick up the execution token
        const parsed = parseInt(token);
        if (isNaN(parsed)) {
            console.log(token + ' ?');
            return false;
        }
        else {
            //push the new token
            body.push(parsed);
        }
    }
}

// function evaluateToken(state, tokens) {
//     let token = tokens.shift();
//     if (typeof (token) === 'function') {
//         token(state);
//         return;
//     }
//     //When the interpreter finds a word, it looks the word up in the dictionary.
//     const word = state.findWord(token);
//     if (word !== undefined) {
//         //If the word is found, the interpreter executes the code associated with the word, and then returns to parse the rest of the input stream. 
//         if (typeof (word.code) === 'function') {
//             word.code(state);
//         }
//         else {
//             evaluateTokens(state, word.code);
//         }
//         return;
//     }

//     //special words
//     //' word to obtain an execution token
//     if (token == 'see') {
//         let nextToken = tokens.shift();
//         let nextWord = state.findWord(nextToken);
//         console.log(nextWord.code);
//         return;
//     }
//     if (token == '\'') {
//         let nextToken = tokens.shift();
//         let nextWord = state.findWord(nextToken);

//         let xt = state.getExecutionToken(nextToken);
//         state.push(xt);
//         return;
//     }
//     if (token == ':') {
//         //TODO triger compilation mode
//         evaluateWordDefinition(state, tokens);
//         return;
//     }

//     //If the word isn't found, the word is assumed to be a number and an attempt is made to convert it into a number and push it on the stack;
//     const parsed = parseInt(token);
//     if (isNaN(parsed)) {
//         console.log(token + ' ?');
//         return false;
//     }
//     else {
//         //push the new token
//         state.stack.push(parsed);
//     }
//     return true;
// }

function repl() {
    let stdin = process.openStdin();
    let state = createInitialState();
    initializeBuiltinWords(state);
    if (process.argv.includes('/noprompt') === false) {
        console.log('? ')
    }

    stdin.addListener("data", function (line) {
        let trimmedLine = line.toString().trim();
        state.evaluateLine(trimmedLine);
    });
}

repl();
