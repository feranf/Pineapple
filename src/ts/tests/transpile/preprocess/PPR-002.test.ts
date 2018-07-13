import { expect } from "chai";
import { pine2js } from "../../../pine2js";
import { assertEquals } from "../../testUtil";

describe("@preprocess-PP-002", () => {
    it("should ignore consequtive newlines", () => {
        const input =
`
def print: (this String) -> Void
    <javascript>
    console.log($this.valueOf());
    </javascript>

def say: (this String) -> Void
    <javascript>
    console.log($this.valueOf());
    </javascript>

`;
        const expectedOutput =
`
function _print_String($this){
// <javascript>
console.log($this.valueOf());
// </javascript>;
}

function _say_String($this){
// <javascript>
console.log($this.valueOf());
// </javascript>;
}
`;
        assertEquals(pine2js(input).trim(), expectedOutput.trim());
    });

});
