import {AtomicToken, FunctionCall} from "../ast";
import {ErrorDetail} from "./errorUtil";

export function ErrorUsingUnknownFunction(relatedFunction: FunctionCall): ErrorDetail {
    const funcname = displayFuncSignature(relatedFunction.signature);
    return {
        code: "0013",
        name: "ErrorUsingUnknownFunction",
        message: `You cannot call the function \`${(funcname)}\` as it does not exist`,
        relatedLocation: relatedFunction.signature[0].location
    };
}

