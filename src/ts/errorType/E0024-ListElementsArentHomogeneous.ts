import { Expression, TypeExpression } from "../ast";
import { stringifyTypeReadable } from "./errorUtil";
import { ErrorDetail } from "./ErrorDetail";
const converter = require("number-to-words");

export function ErrorListElementsArentHomogeneous(
    e: Expression,
    elementPosition: number,
    expectedType: TypeExpression
): ErrorDetail {
    return {
        code: "0024",
        name: "ErrorListElementsArentHomogeneous",
        message:
`The type of every element in a list should be based on the first element, which is:

    ${stringifyTypeReadable(expectedType)}

But the ${converter.toWordsOrdinal(elementPosition + 1)} element has type of:

    ${stringifyTypeReadable(e.returnType)}
`,
        relatedLocation: e.location,
        hint:
`If you want to have a list of elements with different type, you should use Tuple.

For example:

        let myTuple = (1, "2", 3) // No error
`

    };
}
