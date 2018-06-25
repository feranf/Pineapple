// Abstract Syntax Tree Node Interfaces
export interface Declaration {
    kind: "Declaration";
    body: FunctionDeclaration;
    next: Declaration | null;
}

export interface FunctionDeclaration {
    kind: "FunctionDeclaration";
    affix: FunctionAffix;
    signature: string;
    returnType: TypeExpression;
    parameters: Variable[];
    statements: Statement;
}

export interface Statement {
    body: LinkStatement | FunctionCall | JavascriptCode;
    next: Statement | null;
}

export interface LinkStatement {
    kind: "LinkStatement";
    isDeclaration: boolean;
    variable: Variable;
    linkType: "bind" | "assign";
    expression: Expression;
}

export interface TypeExpression {
    kind: "TypeExpression";
    name: string;
    isList: boolean;
    listSize: Expression | null;
    or: TypeExpression | null;
    and: TypeExpression | null;
    // tuple: TupleTypeExpression;
}

export type Expression
    = FunctionCall
    | StringExpression
    | NumberExpression
    | Variable
    | PonExpression // Pineapple Object Notation (PON)
    // | MonoExpression
    ;

export type FunctionAffix = "nofix" | "prefix" | "suffix" | "infix" | "mixfix";

export interface FunctionCall {
    kind: "FunctionCall";
    fix: FunctionAffix;
    signature: string;
    parameters: Expression[];
    returnType: TypeExpression;
}

export interface Variable {
    kind: "Variable";
    name: Token;
    typeExpected: TypeExpression; // This info is captured by parser
    returnType: TypeExpression; // This info should be fill in by type checker
    value: Expression;
}

export interface PonExpression {
    kind: "Pon";
    keyValueList: KeyValueList;
}

export interface KeyValueList {
    keyValue: KeyValue;
    next: KeyValueList | null;
}

export interface KeyValue {
    memberName: Token;
    expression: Expression;
}

export interface StringExpression {
    kind: "String";
    value: string;
    returnType: TypeExpression;
}

export interface NumberExpression {
    kind: "Number";
    value: string;
    returnType: TypeExpression;
}

export interface JavascriptCode {
    kind: "JavascriptCode";
    value: string;
}

export interface Token {
    value: string;
    location: TokenLocation;
}

export interface TokenLocation {
    first_line: number;
    last_line: number;
    first_column: number;
    last_column: number;
}
