# A Forth interpreter

Check out the https://jborza.github.io/interpreters/2020/05/03/beginning-forth.html article for context.

## Built-in words:

### arithmetics:

```
+ - * / mod
```

### stack manipulation:
```
dup drop swap over rot 2dup 2drop nip
```

### comparison
```
> < = 0< 0> 0= and or xor invert
true false as constants
```

### loops
```
begin until do loop  i j
```

### conditionals
```
if then else
```

### misc 
```
depth - shows stack depth
?? - print a list of words
??? - print the variables
```

### execution
```
' execute : :noname
```

### return stack
```
>r <r
```

### memory & variables
```
variable constant @ ! !+ ?
```

### character / string related
```
. ." emit cr
```

### comments
```
( )
```