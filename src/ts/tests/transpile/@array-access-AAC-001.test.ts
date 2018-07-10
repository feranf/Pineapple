import { expect } from "chai";
import { pine2js } from "../../pine2js";

describe("@array-access-AAC-001", () => {
    it("case 1", () => {
        const input =
`
def main:
    let x = [1, 2, 3]
    print: x[0]
`;
        const expectedOutput =
`
function _main(){
const $x = new ArrayOfNumber([(1),(2),(3),]);
$x[(0)]._print();
}
`.trim();

        const result = pine2js(input).trim();
        // console.log(expectedOutput);
        // console.log(result);
        expect(result).to.eq(expectedOutput);
    });

});
