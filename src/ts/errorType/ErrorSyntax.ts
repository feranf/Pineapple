import chalk from "chalk";
import { TokenLocation } from "../ast";
import { ErrorDetail } from "./errorUtil";

export interface ParserErrorDetail {
    text: string;
    token: string;
    line: number;
    loc: TokenLocation;
    expected: string[];
}

export function ErrorSyntax(errorHash: ParserErrorDetail): ErrorDetail {
    return {
        name: "ErrorSyntax",
        message: `Unexpected ${errorHash.token} ${chalk.underline(errorHash.text)}`,
        relatedLocation: errorHash.loc
    };
}