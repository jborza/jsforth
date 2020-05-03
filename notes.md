
# TODO:

- do .. loop remember that the words DO and LOOP are branching commands and that therefore they can only be executed inside a definition.
- do .. loop+ pops the increment from the stack, e.g. 0 10 do i . -1 +loop
- if ... then | if ... else ... then

- state - should be true (compile) or false (interpreting) state
- begin ... until / again / repeat / leave
- begin ... again
- begin ... while ... repeat
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

# if

During compilation, the data stack is used to support control structure balancing, nesting, and back-patching of branch addresses. The snippet:

 ... DUP 6 < IF DROP 5 ELSE 1 - THEN ...

would be compiled to the following sequence inside a definition:

 ... DUP LIT 6 < ?BRANCH 5  DROP LIT 5  BRANCH 3  LIT 1 - ...

The numbers after BRANCH represent relative jump addresses. LIT is the primitive word for pushing a "literal" number onto the data stack.

# CREATE ... DOES >

http://galileo.phys.virginia.edu/classes/551.jvn.fall01/primer.htm

       a. Defining “defining” words 

       CREATE finds its most important use in extending the powerful class of 
       Forth words called “defining” words. The colon compiler  ":"  is such 
       a word, as are VARIABLE and CONSTANT. 

       The definition of VARIABLE in high-level Forth is simple 

           : VARIABLE  CREATE   1 CELLS  ALLOT ;

       We have already seen how VARIABLE is used in a program. (An altern-
       ative definition found in some Forths is

           : VARIABLE  CREATE   0  ,  ;

       —these variables are initialized to 0.)

https://www.complang.tuwien.ac.at/forth/gforth/Docs-html/CREATE_002e_002eDOES_003e-details.html

The word , ("comma") puts TOS (top of the stack?) into the next cell of the dictionary and increments the dictionary pointer by that number of bytes.

The word , takes a number off the stack and stores it into the array. So each time you express a number and follow it with ,, you add one cell to the array.

Reserve one cell of data space and store x in the cell. If the data-space pointer is aligned when , begins execution, it will remain aligned when , finishes execution. An ambiguous condition exists if the data-space pointer is not aligned prior to execution of ,.

https://forth-standard.org/standard/core/CREATE

https://softwareengineering.stackexchange.com/questions/339283/forth-how-do-create-and-does-work-exactly

an implementation of forth words:
https://github.com/philburk/pforth/blob/master/fth/system.fth

: ALLOT ( nbytes -- , allot space in dictionary ) dp +! ( align ) ;

The word , takes a number off the stack and stores it into the array. So each time you express a number and follow it with ,, you add one cell to the array.

so my implementation of here is probably bad...

CREATE does not take anything from the stack or return anything. It parses a word from the input and makes a dictionary entry for it. 
- It does fill in the code for the newly-created word with standard boilerplate code that pushes an aligned address on the stack and simply returns 
- (the same aligned address that subsequent "," (comma) calls would fill in with data). 

Therefore, we could define (initialized) VARIABLE as:

: VARIABLE CREATE 0 , ;

## comma

comma is implemented in gforth as:

`
see ,
: ,
  here cell allot ! ; ok
`

,             n  ---           ,                L0
        Store n into the next available dictionary memory cell, advancing
        the dictionary pointer. (comma)

variable definition therefore comes down to

create myvar <- creates dictionary entry; ' myvar pushes some address
0  <- push the new value
here <- push the here pointer
cell allot <- push 1, allocate 1 cell, move dp forward by cell
! <- store 0 at the here address



## here 

// here is implemented as "dp @"
// dp is a dictionary pointer? global?
// see https://comp.lang.forth.narkive.com/IyPdVBcu/why-dp-is-a-user-variable-in-some-forth-systems

//also, according to https://stackoverflow.com/questions/25630434/how-do-i-control-where-new-forth-words-will-be-compiled
// HERE isn't necessarily where new words will be compiled. HERE points to data space, whereas definitions are written to name space and code space. However, in a traditional design like Gforth, the three are a single contiguous region. See DPANS94 3.3.

Also:

https://dwheeler.com/6502/fig-forth-glossary.txt says

DP            ----  addr                      U,L
        A user variable, the dictionary pointer, which contains the address
        of the next free memory above the dictionary. The value may be read
        by HERE and altered by ALLOT.


, takes one item from the stack, and lays it down in the dictionary. The dictionary is an array of data where Forth puts data and code. Conceptually, there may be separate areas for code and data, but we'll not go into the details now. What matters is that there is a pointer to the end of the dictionary, called HERE. , stores data at this place, and advances the pointer.


# stack inspection

https://www.complang.tuwien.ac.at/forth/gforth/Docs-html/Examining.html

# more links
Forth in forth and assembler (wonderful reading):
https://github.com/AlexandreAbreu/jonesforth/blob/master/jonesforth.f

# branching

Forward branching words (IF, AHEAD) leave an address on the stack. That's (conventionally) the normal data stack. The address points to (or near) the place in the compiled code that needs to be patched later.

The resolving words (THEN, AGAIN) knows the target of the branch. They take the address from the stack and patch the branch.

jonesforth:
Word 0BRANCH emits branching instructions like test %rax,0; jz without actually putting offset in.

Word BRANCH emits an uncondition jmp in the same way (just a 0xE9 opcode on x86).

tldr: it is Forth, you already have a stack at hand so use it.

# writing a forth
https://www.sifflez.org/lectures/ASE/C3.pdf