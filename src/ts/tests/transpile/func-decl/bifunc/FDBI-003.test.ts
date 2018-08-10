import { pine2js } from "../../../../pine2js";
import { assertEquals } from "../../../testUtil";

describe("FDBI-003", () => {
    it("multiple type hierarchy", () => {
        const input =
`
def (this Number) + (that Number) -> Number
    pass

def (this Int) + (that Int) -> Int
    pass

def .main
    let x = 1 + 2.0
    let y = 1 + 2
`;
        const expectedOutput =
`

function _$plus_Number_Number($this,$that){
$$pass$$();
}

function _$plus_Int_Int($this,$that){
$$pass$$();
}

function _main_(){
const $x = _$plus_Number_Number((1),(2.0));
const $y = _$plus_Int_Int((1),(2));
}

`;
        assertEquals(pine2js(input).trim(), expectedOutput.trim());
    });

});
