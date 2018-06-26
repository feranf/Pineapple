import {
    BooleanExpression,
    Declaration,
    Expression,
    FunctionCall,
    FunctionDeclaration,
    JavascriptCode,
    KeyValueList,
    LinkStatement,
    ListElement,
    ListExpression,
    NumberExpression,
    PonExpression,
    Statement,
    StringExpression,
    Token,
    TypeExpression,
    Variable
} from "./ast";

// Note: tp means transpile
// Example: tpDeclaration means transpileDeclaration

export function tpDeclaration(input: Declaration): string {
    if (!input) {
        return "";
    }
    const next = input.next ? tpDeclaration(input.next) : "";
    if (input.body.kind === "FunctionDeclaration") {
        return tpFunctionDeclaration(input.body) + next;
    }
}

export function tpFunctionDeclaration(f: FunctionDeclaration): string {
    const funcSignature = stringifyFuncSignature(f.signature);
    if (f.parameters.length === 0) {
        return "" +
        `
function ${funcSignature}(${tpParameters(f.parameters)}){
${tpStatement(f.statements)};
}
`;
    }
    const targetType = f.parameters[0].typeExpected.name.value;
    if (f.parameters.length === 1) {
        return `${targetType}.prototype.${funcSignature}=function(){
let ${f.parameters[0].name.value} = this;
${tpStatement(f.statements)}}
`;
    }
    if (f.parameters.length === 2) {
        return `${targetType}.prototype.${funcSignature}_${f.parameters[1].typeExpected.name.value}`
        + `=function(${f.parameters.slice(1).map((x) => x.name.value).join(",")}){
const ${f.parameters[0].name.value} = this;
${tpStatement(f.statements)}}
`;
    }
}

export function tpStatement(s: Statement): string {
    const next = s.next　? ";\n" + tpStatement(s.next) : "";
    switch (s.body.kind) {
        case "FunctionCall": return tpFunctionCall(s.body) + next;
        case "LinkStatement": return tpLinkStatement(s.body) + next;
        case "JavascriptCode": return tpJavascriptCode(s.body) + next;
    }
}

export function tpFunctionCall(f: FunctionCall): string {
    const funcSignature = stringifyFuncSignature(f.signature);
    if (f.parameters.length === 0) {
        return `${funcSignature}();`;
    }
    if (f.parameters.length === 1) {
        return `${tpExpression(f.parameters[0])}.${funcSignature}()`;
    }
    if (f.parameters.length === 2) {
        return `(${tpExpression(f.parameters[0])}` +
        `.${funcSignature}_${stringifyType(f.parameters[1].returnType)}(${tpExpression(f.parameters[1])}))`;
    }
}

export function stringifyFuncSignature(signature: Token[]): string {
    return signature.map((x) => x.value.slice(0, -1)).join("_");
}

export function stringifyType(t: TypeExpression): string {
    return t.name.value;
}

export function tpLinkStatement(l: LinkStatement): string {
    return `${l.isDeclaration ? "const" : ""} ${l.variable.name.value} = ${tpExpression(l.expression)}`;
}

export function tpParameters(v: Variable[]): string {
    return removeLastComma(v.map((x) => x.name.value).join(","));
}

export function tpExpression(e: Expression): string {
    switch (e.kind) {
        case "FunctionCall": return tpFunctionCall(e);
        case "String": return tpStringExpression(e);
        case "Number": return tpNumberExpression(e);
        case "Variable": return e.name.value;
        case "Pon": return tpPonExpression(e);
        case "List": return tpListExpression(e);
        case "Boolean": return tpBooleanExpression(e);
    }
}

export function tpJavascriptCode(s: JavascriptCode): string {
    return "" +
`// <javascript>
${s.value.replace(/(<javascript>|<\/javascript>|@.+)/g, "").trim()}
// </javascript>
`;
}
export function tpStringExpression(s: StringExpression): string {
    return `"${s.value.slice(1, -1)}"`;
}

export function tpNumberExpression(e: NumberExpression): string {
    if (e.value.indexOf(".") > -1) {
        return `(${e.value})`;
    } else {
        return `new Int(${e.value})`;
    }
}

export function tpBooleanExpression(e: BooleanExpression): string {
    return e.value;
}

export function tpListExpression(e: ListExpression): string {
    return `[${tpListElements(e.elements)}]`;
}

export function tpListElements(e: ListElement): string {
    return `${tpExpression(e.value)},${e.next ? tpListElements(e.next) : ""}`;
}

export function tpPonExpression(e: PonExpression): string {
    return `{
${tpKeyValueList(e.keyValueList)}
}`;
}

export function tpKeyValueList(e: KeyValueList): string {
    return e.keyValue.memberName.value.slice(1)
        + " : "
        + tpExpression(e.keyValue.expression)
        + (e.next ? ",\n" + tpKeyValueList(e.next) : "")
        ;
}

export function removeLastComma(s: string): string {
    return s[s.length - 1] === ",\n" ? s.slice(0, -1) : s ;
}
