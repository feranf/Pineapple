import { AtomicToken, KeyValue, StructDeclaration } from "../ast";
import { ErrorDetail } from "./errorUtil";

export function ErrorExtraMember(
    extraMember: AtomicToken,
    relatedStruct: StructDeclaration
): ErrorDetail {
    return {
        name: "ErrorExtraMember",
        message: `${relatedStruct.name.repr} should not have the member ${extraMember.repr}`,
        relatedLocation: extraMember.location
    };
}
