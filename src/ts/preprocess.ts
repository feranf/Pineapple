import { labelIndentation } from "./labelIndentation";
import { labelLineNumbers } from "./labelLineNumbers";
import { labelNewlines } from "./labelNewlines";
import { smoothify } from "./smoothify";

export function preprocess(input: string): string {

    // let result = input.replace(/(\r\n|\r|\n)+/g, "\n");
    // result += "\n";
    let result = input;
    result = labelNewlines(result);
    result = smoothify(result);
    result = labelIndentation(result);
    // result = result.replace(/@DEDENT@DEDENT/g, "@DEDENT@DEDENT@NEWLINE");
    // console.log(labelLineNumbers(result, 0));
    // console.log(result);
    result += "@EOF";
    return result;
}
