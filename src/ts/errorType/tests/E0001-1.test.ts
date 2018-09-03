import { testError } from "../../tests/testUtil";

testError("ErrorAccessingInexistentMember", `
def People
    :name String
    :age  Number

def .main
    let x = new People
        :name = "Wong"
        :age  = 99

    let y = x:nam
`);
