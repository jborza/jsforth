# loop implementation

considering a simple example:

`
3 0 : f do i . loop ;
`

After setting up the function we have [3, 0] on the stack.

Let's start executing `f`

`do` pops the loop counter off the stack and pushes it into the return stack (where we can copy it to the main stack by `i`)
`i` pushes the current loop counter (0) to the stack, so we end up with [3, 0] again.
`.` pops 0 off the stack and prints it, so we end up with [3]
`loop` pops the loop counter (0) and increments it from the return stack, the counter limit (3) from the stack.
    If the loop counter >= counter limit: we exit the loop
    Otherwise: we increment the loop counter and go back to the instruction after `do`
        how? the call chain up to now is in `evaluateToken` of the function f, and in `executeWord` looping over all of the code bits. We could introduce an 'instruction pointer' that `executeWord` could use OR introduce a loop control structure that can ingest all instruction the compiler emits its own set of instructions until the `loop` word.
        
Even simpler case:

` forth
3 0 : f do i loop ;
`

this control structure, however, would need to be customized per each control structure (if, do..loop, begin..until)

begin..until could be easier?

: h begin 1+ dup dup . 10 >= until ;

but still would make sense to implement a branch of some kind (within an execution context, that could jump forward / backward a specific amount of "instructions")


then a begin..until with a following body:


` forth
: once begin 3 . true until ; 
: twice 2 begin 1 - dup . dup 0= until ;
: forever begin 4 . false until ;
`