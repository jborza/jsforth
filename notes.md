
# TODO:

- do .. loop remember that the words DO and LOOP are branching commands and that therefore they can only be executed inside a definition.
- do .. loop+ pops the increment from the stack, e.g. 0 10 do i . -1 +loop
- if ... then | if ... else ... then
- :noname
- state - should be true (compile) or false (interpreting) state
- begin ... until / again / repeat / leave
- begin ... again
- begin ... while ... repeat
- arrays
- dictionaries?

# notes 

The word : (colon) parses a name as a parameter, creates a dictionary entry (a colon definition) and enters compilation state. The interpreter continues to read space-delimited words from the user input device. If a word is found, the interpreter executes the compilation semantics associated with the word, instead of the interpretation semantics. The default compilation semantics of a word are to append its interpretation semantics to the current definition.[21]

words should not be a dictionary, but a linked list (or an array with two properties: name and body)
it's also an immutable structure (i think)

name is NOT necessary, there's a special :NONAME , unnamed words can be defined with the word :NONAME which compiles the following words up to the next ; (semi-colon) and leaves an execution token on the data stack. The execution token provides an opaque handle for the compiled semantics,

The word ' (tick) takes the name of a word as a parameter and returns the execution token associated with that word on the data stack.

body can be a native function or a list
or easier - always a list and it can include a native function?

~ = [{'name':'drop', 'body': s=>s.pop()}]
: drop_two_100 dup dup 100 ; -> [{'name':'drop_two', 'body': [ ~drop,  ~drop, 100 ] }] where ~drop is the execution token for drop

# Links

https://www.forth.com/starting-forth/9-forth-execution/

# more notes

The parser should be available to the words. 

Also the words should not just be split by empty space.

Differently, the word ( should ask the parser to collect a sequence of characters until ) and discard the results.
Any word, not just the main interpreter, can call the parser.

COMPILATION, in this system, means adding (a new word) to the top of the dictionary. To do this, each called wordname is translated from the ASCII name found in the source text to the corresponding memory addresses of its entry point. This number is added to the end of the "object code" definition of the word.

probably by: word	( char -- pstr ) 	Collect a string delimited by char from input string and place in memory at pstr.

The reason that this didn't happen is bound up in the way that : works. The word : does two special things. The first special thing that it does prevents the text interpreter from ever seeing the characters add-two. The text interpreter uses a variable called >IN (pronounced “to-in”) to keep track of where it is in the input line. When it encounters the word : it behaves in exactly the same way as it does for any other word; it looks it up in the name dictionary, finds its xt and executes it. When : executes, it looks at the input buffer, finds the word add-two and advances the value of >IN to point past it. It then does some other stuff associated with creating the new definition (including creating an entry for add-two in the name dictionary). When the execution of : completes, control returns to the text interpreter, which is oblivious to the fact that it has been tricked into ignoring part of the input line.

Words like : – words that advance the value of >IN and so prevent the text interpreter from acting on the whole of the input line – are called parsing words.

also, there is "state" keeping track of the current itnerpreter state. not really isCompileMode

In ANS Forth, the current state of the interpreter can be read from the flag STATE which contains the value true when in compilation state and false otherwise. This allows the implementation of so-called state-smart words with behavior that changes according to the current state of the interpreter.

# the second stack?

http://www.forth.org/svfig/Len/softstak.htm

When a word is invoked, the inner interpreter puts the next address on the return stack. When the word is completed the top item on the return stack is popped into a register called ip (instruction pointer), and execution continues from there. Most Forths that run on Intel machines use the BP register for ip.

https://www.complang.tuwien.ac.at/forth/gforth/Docs-html/Return-Stack-Tutorial.html

>r takes an element from the data stack and pushes it onto the return stack; conversely, r> moves an elementm from the return to the data stack; r@ pushes a copy of the top of the return stack on the data stack.