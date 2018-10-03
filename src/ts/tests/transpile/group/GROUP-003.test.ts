import { testTranspile } from "../../testUtil";

testTranspile("group inheritance", 
`
def group SyntaxNode

def group Expression

def Expression is SyntaxNode

def (this T).toJS -> String
    if T is SyntaxNode

def Addition
    :left   Number
    :right  Number

def Addition is Expression

def (this Addition).toJS -> String
    pass

`,
`
$$GROUP$$["SyntaxNode"] = {};

$$GROUP$$["Expression"] = {};

function _toJS_SyntaxNode($this){
return $$GROUP$$["SyntaxNode"][$$typeof$$($this)]($this)
}

`) 