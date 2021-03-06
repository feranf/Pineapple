import { SourceCode } from "./interpret";
import { newBuiltinType } from "./typeTree";

// Abstract Syntax Tree Node Interfaces
export type GenericList = TypeExpression[];

export interface SyntaxTree {
    source: SourceCode;
    declarations: Declaration[];
    importedFiles: {[filename: string]: true};
}

export type Declaration
    = FunctionDeclaration
    | StructDeclaration
    | ImportDeclaration
    | EnumDeclaration
    | ExampleDeclaration
    | GroupDeclaration
    | GroupBindingDeclaration
    // TODO: To be implemented soon
    // | InterfaceDeclaration
    // | ImplementionDeclaration
    ;

export interface GroupBindingDeclaration {
    kind: "GroupBindingDeclaration";
    childType: TypeExpression;
    parentType: TypeExpression;
}


export interface GroupDeclaration {
    kind: "GroupDeclaration";
    name: AtomicToken;
    nullable: boolean;
    location: TokenLocation;

    // This property is required by the transpiler (for dynamic dispatching)
    // It is not generated by the parser
    // However, it is to be completed by the static analyzer (i.e. fillUpTypeInfo)
    // It means which functions are tied to this group
    bindingFunctions: FunctionDeclaration[];
}

export interface ExampleDeclaration {
    kind: "ExampleDeclaration";
    description: string | null;
    statements: Statement[];
    location: TokenLocation;
}

export interface FunctionDeclaration {
    kind: "FunctionDeclaration";
    affix: FunctionAffix;
    signature: AtomicToken[];
    returnType: TypeExpression | null;
    parameters: VariableDeclaration[];
    statements: Statement[];
    originFile: string;
    isAsync: boolean;
    typeConstraint ?: TypeConstraint;
    groupBinding ?: GroupBindingStatement;
}

export interface GroupBindingStatement {
    kind: "GroupBindingStatement";
    genericList: AtomicToken[];
    typeBinded: TypeExpression;
}

export interface TypeConstraint {
    kind: "TypeConstraint";
    traitName: AtomicToken;
    genericList: GenericList;
}

export interface StructDeclaration {
    kind: "StructDeclaration";
    name: AtomicToken;
    members: MemberDefinition[];
    genericList: GenericTypename[];
    location: TokenLocation;
    originFile: string;
}

export interface MemberDefinition {
    name: AtomicToken;
    expectedType: TypeExpression;
}

export type Statement
    = AssignmentStatement
    | FunctionCall
    | JavascriptCode
    | ReturnStatement
    | BranchStatement
    | ForStatement
    | WhileStatement
    | PassStatement
    | EnsureStatement
    | ExampleStatement
    ;

export interface ExampleStatement {
    kind: "ExampleStatement";
    left: Expression;
    right: Expression;
    location: TokenLocation;
    originFile: string;
}

export interface EnsureStatement {
    kind: "EnsureStatement";
    expression: Expression;
    location: TokenLocation;
    callingFile: string;
}

export interface ImportDeclaration {
    kind: "ImportDeclaration";
    filename: StringExpression;
    originFile: string;  // originFile means where the current declaration is declared
}

export interface PassStatement {
    kind: "PassStatement";
    location: TokenLocation;
    callingFile: string;
}

export interface WhileStatement {
    kind: "WhileStatement";
    test: Expression;
    body: Statement[];
}

export interface ForStatement {
    kind: "ForStatement";
    iterator: Variable;
    expression: Expression;
    body: Statement[];
}

export interface BranchStatement {
    kind: "BranchStatement";
    test: Expression;
    body: Statement[];
    elseBranch: BranchStatement;
}

export interface ReturnStatement {
    kind: "ReturnStatement";
    expression: Expression;
    location: TokenLocation;
}

export interface AssignmentStatement {
    kind: "AssignmentStatement";
    variable: Variable | VariableDeclaration;
    isDeclaration: boolean;
    expression: Expression;
}

export type TypeExpression
    = UnresolvedType       // e.g. String or List{Number}
    | ResolvedType
    ;

export type ResolvedType
    = GenericTypename  // e.g. T, T1 or T2
    | VoidType
    | EnumDeclaration
    | StructType
    | BuiltinType
    | GroupDeclaration
    ;

export interface BuiltinType {
    kind: "BuiltinType";
    name: BuiltinTypename;
    genericList: GenericList;
    nullable: boolean;
    location: TokenLocation;
}
export type BuiltinTypename
    = "Any"
    | "Number"
    | "Integer"
    | "String"
    | "Date"
    | "List"
    | "Table"
    | "Struct"
    | "Tuple"
    | "Enum"
    ;

export interface StructType {
    kind: "StructType";
    reference: StructDeclaration;
    nullable: boolean;
    genericList: GenericList;
    location: TokenLocation;
}

export interface EnumDeclaration {
    kind: "EnumDeclaration";
    name: AtomicToken;
    enums: AtomicToken[];
    location: TokenLocation;
    nullable: boolean;
    originFile: string;
}

export interface EnumExpression {
    kind: "EnumExpression";
    value: AtomicToken;
    returnType: EnumDeclaration;
    location: TokenLocation;
}

export interface VoidType {
    kind: "VoidType";
    name: AtomicToken;
    location: TokenLocation;
    nullable: boolean;
}

export interface UnresolvedType {
    kind: "UnresolvedType";
    name: AtomicToken;
    nullable: boolean;
    location: TokenLocation;
    genericList: Array<UnresolvedType | GenericTypename>;
}

export interface GenericTypename {
    kind: "GenericTypename";
    name: AtomicToken; // "T" | "T1" | "T2";
    nullable: boolean;
    location: TokenLocation;
}

export type Expression
    = FunctionCall
    | StringExpression
    | NumberExpression
    | EnumExpression
    | Variable
    | ObjectExpression // Pineapple Object Notation (PON)
    | ObjectAccess
    | ListExpression // a.k.a. Array. To store elements of same type
    | TupleExpression // to store element of different type
    | AnonymousExpression
    | Lambda
    | StringInterpolationExpression
    ;

export interface StringInterpolationExpression {
    kind: "StringInterpolationExpression";
    expressions: Expression[];
    location: TokenLocation;
    returnType: TypeExpression;
}

export interface TupleExpression {
    kind: "TupleExpression";
    elements: Expression[];
    location: TokenLocation;
    returnType: TypeExpression;
}

export interface AnonymousExpression {
    kind: "AnonymousExpression";
    position: 0 | 1 | 2 | 3 | 4 | 5;
    location: TokenLocation;
    returnType: TypeExpression;
}

export interface Lambda {
    kind: "Lambda";
    returnType: TypeExpression;
    location: TokenLocation;
    // placeholders: //TODO: Complete this
}

export type FunctionAffix = "nofix" | "prefix" | "suffix" | "infix" | "mixfix";

export interface FunctionCall {
    kind: "FunctionCall";
    fix: FunctionAffix;
    signature: AtomicToken[];
    parameters: Expression[];
    returnType: TypeExpression;
    location: TokenLocation;
    isAsync: boolean;
    callingFile: string;
}

export interface VariableDeclaration {
    kind: "VariableDeclaration";
    variable: Variable;
    isMutable: boolean;
    typeExpected: TypeExpression; // This info is captured by parser
}

export interface Variable extends AtomicToken {
    kind: "Variable";
    isMutable: boolean;
    returnType: TypeExpression; // This info should be fill in by type checker
}

export interface ObjectExpression { // NOTE: Object is also Dictionary/Table
    kind: "ObjectExpression";
    constructor: TypeExpression;
    keyValueList: KeyValue[];
    returnType: TypeExpression;
    location: TokenLocation;
}

export function EmptyTable(location: TokenLocation, type: TypeExpression): ObjectExpression {
    return {
        kind: "ObjectExpression",
        constructor: type,
        keyValueList: [],
        returnType: type,
        location: location
    };
}

export interface KeyValue {
    memberName: AtomicToken;
    expression: Expression;
}

export interface ObjectAccess {
    kind: "ObjectAccess";
    subject: Expression;
    key: AtomicToken;
    returnType: TypeExpression;
    location: TokenLocation;
}

export interface ListExpression {
    kind: "List";
    elements: Expression[];
    location: TokenLocation;
    returnType: TypeExpression;
}

export function EmptyList(location: TokenLocation, returnType: TypeExpression): ListExpression {
    return {
        kind: "List",
        elements: [],
        location: location,
        returnType: returnType
    };
}

export interface StringExpression extends AtomicToken {
    kind: "String";
    repr: string;
    returnType: TypeExpression;
}

export function newStringExpression(repr: string, location: TokenLocation): StringExpression {
    return {
        kind: "String",
        repr: repr,
        returnType: newBuiltinType("String"),
        location: location
    };
}

export interface NumberExpression extends AtomicToken {
    kind: "Number";
    returnType: TypeExpression;
}

export interface JavascriptCode extends AtomicToken {
    kind: "JavascriptCode";
}

export interface AtomicToken {
    repr: string; // shorthand for representation
    location: TokenLocation;
}

export interface TokenLocation {
    first_line: number;
    last_line: number;
    first_column: number;
    last_column: number;
}

export function NullTokenLocation(): TokenLocation {
    return {
        first_column: -1,
        first_line: -1,
        last_column: -1,
        last_line: -1,
    };
}

export function newGenericTypename(placeholder: string): GenericTypename {
    return {
        kind: "GenericTypename",
        name: newAtomicToken(placeholder),
        location: NullTokenLocation(),
        nullable: false
    };
}

export function newAtomicToken(repr: string): AtomicToken {
    return {
        repr: repr,
        location: NullTokenLocation()
    };
}
