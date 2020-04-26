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

TODO:
- do .. loop
- do .. loop+
- ? (addr -) // displays the contents of a variable
- :noname

The parser should be available to the words. 

Also the words should not just be split by empty space.

Differently, the word ( should ask the parser to collect a sequence of characters until ) and discard the results.
Any word, not just the main interpreter, can call the parser.

COMPILATION, in this system, means adding (a new word) to the top of the dictionary. To do this, each called wordname is translated from the ASCII name found in the source text to the corresponding memory addresses of its entry point. This number is added to the end of the "object code" definition of the word.

probably by: word	( char -- pstr ) 	Collect a string delimited by char from input string and place in memory at pstr.