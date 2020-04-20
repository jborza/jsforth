function createInitialState() {
    return {
        stack: [],
        words: {},

        push: function(x) { return this.stack.push(x)},
        pop: function() {
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
    state.words['+'] = (s)=> {state.push(state.pop() + state.pop())};
    state.words['-'] = (s)=> {state.push(state.pop() - state.pop())};;
    state.words['*'] = (s) => {state.push(state.pop() * state.pop())};
    state.words['/'] = (s) => {state.push(state.pop() / state.pop())};
    state.words['.'] = (s) => { console.log(state.pop()) };
    state.words['dup'] = (s) => {
         let x = state.pop();
         state.push(x); 
         state.push(x); 
        };
    state.words['drop'] = (s) => { state.pop()};
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
    if(line == '?')
    {
        console.log(state.stack);
        return;
    }
    let tokens = line.split(' ');
    for (token of tokens) {
        if(evaluateToken(state, token) === false)
            break;
    }
}

function evaluateToken(state, token) {
    //When the interpreter finds a word, it looks the word up in the dictionary.
    if (token in state.words) {
        //If the word is found, the interpreter executes the code associated with the word, and then returns to parse the rest of the input stream. 
        state.words[token](state);
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