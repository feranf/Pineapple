import chalk from "chalk";
import { Variable } from "../ast";
import { ErrorDetail } from "./ErrorDetail";

export function ErrorAssigningToImmutableVariable(
    relatedVariable: Variable
): ErrorDetail {
    return {
        code: "0002",
        name: "ErrorAssigningToImmutableVariable",
        message: `You cannot assign value to variable ${chalk.bold.underline(relatedVariable.repr)}` +
        ` as it is immutable.`,
        hint:
`In Pineapple, every variable is immutable by default.
To make a variable mutable, you have to use the \`mutable\` keyword.

For example:

        let mutable ${relatedVariable.repr} = 123`,
        relatedLocation: relatedVariable.location
    };
}
