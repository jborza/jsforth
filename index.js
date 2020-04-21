function createInitialState() {
    return {
        stack: [],
        words: {},
        
        push: function (x) { return this.stack.push(x) },
        pop: function () {
            const x = this.stack.pop();
            if (x === undefined) {
                console.log('Stack underflow');
            }
            return x;
        }
    };
}

function initializeBuiltinWords(state) {
    //a word prototype just operates on the stack 
    state.words['+'] = (s) => { state.push(state.pop() + state.pop()) };
    state.words['-'] = (s) => { state.push(state.pop() - state.pop()) };;
    state.words['*'] = (s) => { state.push(state.pop() * state.pop()) };
    state.words['/'] = (s) => { state.push(state.pop() / state.pop()) };
    state.words['.'] = (s) => { console.log(state.pop()) };
    state.words['dup'] = (s) => {
        let x = state.pop();
        state.push(x);
        state.push(x);
    };
    state.words['drop'] = (s) => { state.pop() };
    state.words['swap'] = (s) => {
        let x2 = state.pop();
        let x1 = state.pop();
        state.push(x2);
        state.push(x1);
    }
    state.words['over'] = (s) => {
        let x2 = state.pop();
        let x1 = state.pop();
        state.push(x1);
        state.push(x2);
        state.push(x1);
    }
    state.words['rot'] = (s) => {
        let x3 = state.pop();
        let x2 = state.pop();
        let x1 = state.pop();
        state.push(x2);
        state.push(x3);
        state.push(x1);
    }
    state.words['emit'] = (s) => {
        let c = state.pop();
        process.stdout.write(String.fromCharCode(c));
    }
    state.words['cr'] = (s) => {
        process.stdout.write('\n');
    }
}

function evaluateLine(state, line) {
    if (line == '?') {
        console.log(state.stack);
        return;
    }
    if (line == '??') {
        console.log(state.words);
    }
    let tokens = line.split(' ');
    //feed them into the evaluation function
    evaluateTokens(state, tokens);
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
    //eat words and store a function definition
    let body = [];
    let name = tokens.shift();
    if (name == undefined)
        return;
    while (tokens.length > 0) {
        token = tokens.shift();
        if (token == ';') {
            //end word definition
            state.words[name] = body;
            return;
        }
        if (canAccept(state, token)) {
            body.push(token);
        }
    }
}

function evaluateToken(state, tokens) {
    token = tokens.shift();
    //When the interpreter finds a word, it looks the word up in the dictionary.
    if (token in state.words) {
        //If the word is found, the interpreter executes the code associated with the word, and then returns to parse the rest of the input stream. 
        word = state.words[token];
        if (typeof (word) === 'function') {
            state.words[token](state);
        }
        else {
            evaluateTokens(state, word);
        }
        return;
    }

    //special words
    //TODO definitions
    //TODO conditionals: if ... then | if ... else ... then
    // -  Conditionals in Forth can only be used inside definitions. 
    //DO .. LOOP: remember that the words DO and LOOP are branching commands and that therefore they can only be executed inside a definition.
    //+LOOP pops the increment from the stack, e.g. 0 10 do i . -1 +loop

    if (token == ':') {
        evaluateWordDefinition(state, tokens);
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
        state.stack.push(parsed);
    }
    return true;
}

function repl() {
    let stdin = process.openStdin();
    let state = createInitialState();
    initializeBuiltinWords(state);
    console.log('? ')

    stdin.addListener("data", function (line) {
        let trimmedLine = line.toString().trim();
        evaluateLine(state, trimmedLine);
    });
}

repl();