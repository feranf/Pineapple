import {
    AtomicToken,
    BooleanExpression,
    BranchStatement,
    CompoundType,
    Declaration,
    Expression,
    ForStatement,
    FunctionCall,
    FunctionDeclaration,
    KeyValue,
    LinkedNode,
    ListExpression,
    NullTokenLocation,
    NumberExpression,
    ReturnStatement,
    Statement,
    StringExpression,
    StructDeclaration,
    TestExpression,
    TokenLocation,
    TypeExpression,
    Variable,
    VariableDeclaration
} from "./ast";

import { ErrorAccessingInexistentMember } from "./errorType/E0001-AccessingInexistentMember";
import { ErrorAssigningToImmutableVariable } from "./errorType/E0002-AssigningToImmutableVariable";
import { ErrorDuplicatedMember } from "./errorType/E0003-DuplicatedMember";
import { ErrorExtraMember } from "./errorType/E0004-ExtraMember";
import { ErrorIncorrectTypeGivenForMember } from "./errorType/E0005-IncorrectTypeGivenForMember";
import { ErrorIncorrectTypeGivenForVariable } from "./errorType/E0006-IncorrectTypeGivenForVariable";
import { ErrorMissingMember } from "./errorType/E0007-ErrorMissingMember";
import { ErrorNoConformingFunction } from "./errorType/E0008-NoConformingFunction";
import { ErrorNoStructRedeclare } from "./errorType/E0009-NoStructRedeclare";
import { ErrorUnmatchingReturnType } from "./errorType/E0011-UnmatchingReturnType";
import { ErrorUsingUndefinedStruct } from "./errorType/E0012-UsingUndefinedStruct";
import { ErrorUsingUnknownFunction } from "./errorType/E0013-UsingUnknownFunction";
import { ErrorDetail, renderError } from "./errorType/errorUtil";
import { ErrorVariableRedeclare } from "./errorType/ErrorVariableRedeclare";
import { flattenLinkedNode } from "./getIntermediateForm";
import { SourceCode } from "./interpreter";
import { prettyPrint } from "./pine2js";
import { stringifyFuncSignature, stringifyType } from "./transpile";
import { childOf, insertChild, newSimpleType, TypeTree } from "./typeTree";
import { find } from "./util";

let CURRENT_SOURCE_CODE: () => SourceCode;
export function fillUpTypeInformation(
        decls: Declaration[],
        prevFuntab: FunctionTable,
        prevTypeTree: TypeTree,
        prevStructTab: StructTable,
        sourceCode: SourceCode
    ): [Declaration[], FunctionTable, TypeTree, StructTable] {

    CURRENT_SOURCE_CODE = () => sourceCode;
    // Complete the function table
    // This step is to allow programmer to define function anywhere
    // without needing to adhere to strict top-down or bottom-up structure
    let funcTab = prevFuntab;
    for (let i = 0; i < decls.length; i++) {
        const currentDecl = decls[i];
        switch (currentDecl.kind) {
            case "FunctionDeclaration":
                funcTab = newFunctionTable(currentDecl, funcTab);
                break;
        }
    }

    for (let i = 0; i < decls.length; i++) {
        const currentDecl = decls[i];
        switch (currentDecl.kind) {
            case "FunctionDeclaration":
                const vtab = getVariableTable(currentDecl.parameters);
                const symbols: SymbolTable = {
                    vartab: vtab,
                    functab: funcTab,
                    typeTree: prevTypeTree,
                    structTab: prevStructTab,
                };
                const [statements, newSymbols] = fillUp(currentDecl.statements, symbols);
                currentDecl.statements = statements;
                funcTab = newSymbols.functab;
                verifyFunctionDeclaration(currentDecl);
                break;
            case "StructDeclaration":
                prevTypeTree = insertChild(currentDecl, newSimpleType("Object"), prevTypeTree);
                prevStructTab = newStructTab(currentDecl, prevStructTab);
                break;
        }
    }
    return [decls, funcTab, prevTypeTree, prevStructTab];
}

export function newStructTab(s: StructDeclaration, structTab: StructTable): StructTable {
    if (s.name.repr in structTab) {
        raise(ErrorNoStructRedeclare(s));
        // throw new Error(`${s.name.repr} is already defined.`);
    } else {
        structTab[s.name.repr] = s;
    }
    return structTab;
}

export function newFunctionTable(newFunc: FunctionDeclaration, previousFuncTab: FunctionTable): FunctionTable {
    const key = stringifyFuncSignature(newFunc.signature);
    if (newFunc.returnType === null) {
        newFunc.returnType = {kind: "VoidType", location: NullTokenLocation()};
    }
    if (!previousFuncTab[key]) {
        previousFuncTab[key] = [];
    }
    if (previousFuncTab[key].some((x) => functionEqual(x, newFunc))) {
        // dont append the new function into the function table
    } else {
        previousFuncTab[key].push(newFunc);
    }
    return previousFuncTab;
}

export function verifyFunctionDeclaration(f: FunctionDeclaration) {
    // Check if return statements are correct
    const returnStatements =
        flattenLinkedNode(f.statements).filter((x) => x.kind === "ReturnStatement") as ReturnStatement[];
    for (let i = 0; i < returnStatements.length; i++) {
        const r = returnStatements[i];
        if (!typeEquals(r.expression.returnType, f.returnType)) {
            raise(ErrorUnmatchingReturnType(r, f.returnType));
        }
    }
}

export function functionEqual(x: FunctionDeclaration, y: FunctionDeclaration): boolean {
    if (stringifyFuncSignature(x.signature) !== stringifyFuncSignature(y.signature)) {
        return false;
    } else if (x.parameters.length !== y.parameters.length) {
        return false;
    } else {
        for (let i = 0; i < x.parameters.length; i++) {
            if (!typeEquals(x.parameters[i].typeExpected, y.parameters[i].typeExpected)) {
                return false;
            }
        }
    }
    return true;
}

export function getVariableTable(variables: VariableDeclaration[]): VariableTable {
    const result: VariableTable = {};
    for (let i = 0; i < variables.length; i++) {
        variables[i].variable.returnType = variables[i].typeExpected;
        variables[i].variable.isMutable = variables[i].isMutable;
        result[variables[i].variable.repr] = variables[i].variable;
    }
    return result;
}

export interface SymbolTable {
    vartab: VariableTable;
    functab: FunctionTable;
    structTab: StructTable;
    typeTree: TypeTree;
}

export interface StructTable {
    [key: string]: StructDeclaration;
}

export interface VariableTable {
    [key: string]: Variable;
}

export interface FunctionTable {
    [key: string]: FunctionDeclaration[];
}

function updateVariableTable(vtab: VariableTable, variable: Variable): VariableTable {
    const initialVariable = vtab[variable.repr];
    if (initialVariable !== undefined) {
        raise(ErrorVariableRedeclare(initialVariable, variable));
    }
    vtab[variable.repr] = variable;
    return vtab;
}

export function raise(errorDetail: ErrorDetail, sourceCode: SourceCode = CURRENT_SOURCE_CODE()) {
    const e = Error(renderError(sourceCode, errorDetail));
    e.name = errorDetail.name;
    throw e;
}

export function fillUp(s: LinkedNode<Statement>, symbols: SymbolTable):
    [LinkedNode<Statement>, SymbolTable] {
    switch (s.current.kind) {
    case "ReturnStatement":
        [s.current.expression, symbols] = fillUpExpressionTypeInfo(s.current.expression, symbols);
        break;
    case "AssignmentStatement":
        switch (s.current.variable.kind) {
        case "VariableDeclaration":
            if (s.current.variable.typeExpected === null) {
                // Inference-typed
                [s.current.expression, symbols] = fillUpExpressionTypeInfo(s.current.expression, symbols);
                s.current.variable.variable.returnType = s.current.expression.returnType;
            } else {
                // Statically-typed
                [s.current.expression, symbols] = fillUpExpressionTypeInfo(s.current.expression, symbols);
                s.current.variable.variable.returnType = s.current.variable.typeExpected;
                if (!typeEquals(s.current.variable.typeExpected, s.current.expression.returnType)) {
                    raise(ErrorIncorrectTypeGivenForVariable(s.current.variable, s.current.expression.returnType));
                }
            }
            s.current.variable.variable.isMutable = s.current.variable.isMutable;
            symbols.vartab = updateVariableTable(symbols.vartab, s.current.variable.variable);
            break;
        case "Variable":
            const matching = symbols.vartab[s.current.variable.repr];
            if (!matching.isMutable) {
                raise(ErrorAssigningToImmutableVariable(s.current.variable));
            }
            [s.current.expression, symbols] = fillUpExpressionTypeInfo(s.current.expression, symbols);
            if (!typeEquals(matching.returnType, s.current.expression.returnType)) {
                errorMessage(
`The data type of ${matching.repr} should be ${stringifyType(matching.returnType)}, ` +
`but you assigned it with ${stringifyType(s.current.expression.returnType)}`, matching.location);
            } else {
                s.current.variable.returnType = matching.returnType;
            }
            break;
        }
        break;
    case "FunctionCall":
        [s.current, symbols.functab] = fillUpFunctionCallTypeInfo(s.current, symbols);
        break;
    case "BranchStatement":
        [s.current, symbols] = fillUpBranchTypeInfo(s.current, symbols);
        break;
    case "ForStatement":
        [s.current, symbols] = fillUpForStmtTypeInfo(s.current, symbols);
        break;
    case "WhileStatement":
        [s.current.test, symbols] = fillUpTestExprTypeInfo(s.current.test, symbols);
        [s.current.body, symbols] = fillUp(s.current.body, symbols);
        break;
    }
    if (s.next !== null) {
        [s.next, symbols] = fillUp(s.next, symbols);
    }
    return [s, symbols];
}

export function fillUpForStmtTypeInfo(f: ForStatement, symbols: SymbolTable):
    [ForStatement, SymbolTable] {
    [f.expression, symbols] = fillUpExpressionTypeInfo(f.expression, symbols);
    if (f.expression.returnType.kind === "CompoundType") {
        f.iterator.returnType = f.expression.returnType.of.current;
        symbols.vartab = updateVariableTable(symbols.vartab, f.iterator);
    } else {
        errorMessage("The expresison type in for statement should be array.", null);
    }
    [f.body, symbols] = fillUp(f.body, symbols);
    return [f, symbols];
}

export function fillUpTestExprTypeInfo(t: TestExpression, symbols: SymbolTable):
    [TestExpression, SymbolTable] {
    [t.current, symbols.functab] = fillUpFunctionCallTypeInfo(t.current, symbols);
    let next = t.next;
    while (next !== null) {
        [next.current, symbols.functab] = fillUpFunctionCallTypeInfo(next.current, symbols);
        next = next.next;
    }
    return [t, symbols];
}

export function fillUpBranchTypeInfo(b: BranchStatement, symbols: SymbolTable):
    [BranchStatement, SymbolTable] {
    [b.body, symbols] = fillUp(b.body, symbols);
    if (b.test !== null) {
        [b.test, symbols] = fillUpTestExprTypeInfo(b.test, symbols);
    }
    if (b.elseBranch !== null) {
        [b.elseBranch, symbols] = fillUpBranchTypeInfo(b.elseBranch, symbols);
    }
    return [b, symbols];
}

export function fillUpExpressionTypeInfo(e: Expression, symbols: SymbolTable):
    [Expression, SymbolTable] {
    switch (e.kind) {
        case "FunctionCall":
            [e, symbols.functab] = fillUpFunctionCallTypeInfo(e, symbols);
            return [e, symbols];
        case "List":            e = fillUpArrayTypeInfo       (e, symbols); break;
        case "Number":          e = fillUpSimpleTypeInfo      (e, "Number"); break;
        case "String":          e = fillUpSimpleTypeInfo      (e, "String"); break;
        case "Boolean":         e = fillUpSimpleTypeInfo      (e, "Boolean"); break;
        case "Variable":        e = fillUpVariableTypeInfo    (e, symbols.vartab); break;
        case "ObjectExpression":
            if (e.constructor !== null) {
                e.returnType = getStruct(e.constructor, symbols.structTab);
                [e.keyValueList, symbols] = fillUpKeyValueListTypeInfo(e.keyValueList, symbols);
                checkIfKeyValueListConforms(e.keyValueList, e.returnType);
            } else {
                e.returnType = newSimpleType("Dict");
            }
            break;
        case "ObjectAccess":
            [e.subject, symbols] = fillUpExpressionTypeInfo(e.subject, symbols);
            switch (e.subject.returnType.kind) {
            case "StructDeclaration":
                e.returnType = findMemberType( e.key, e.subject.returnType);
                break;
            case "SimpleType":
                if (e.subject.returnType.name.repr === "Dict") {
                    throw new Error("Unimplemented yet");
                } else {
                    throw new Error("Must be dictionary type");
                }
                break;
            default:
                throw new Error("Must be dictionary type of object type");
            }
            break;
        default:
            throw new Error("Unimplemented yet");
    }
    return [e, symbols];
}

export function checkIfKeyValueListConforms(
    keyValues: LinkedNode<KeyValue>,
    structDecl: StructDeclaration
): void {
    const kvs = flattenLinkedNode(keyValues);
    const members = flattenLinkedNode(structDecl.members);

    // Check if every declared member is in member definitions
    for (let i = 0; i < kvs.length; i++) {
        const matchingMember = find(kvs[i], members, (k, m) => k.memberName.repr === m.name.repr);
        if (matchingMember === null) {
            raise(ErrorExtraMember(kvs[i].memberName, structDecl));
        } else {
            // Check if type are equals to expected
            if (!typeEquals(matchingMember.expectedType, kvs[i].expression.returnType)) {
                raise(ErrorIncorrectTypeGivenForMember(matchingMember.expectedType, kvs[i]));
            }
        }
    }

    // Check if every member definition is present in declared member
    for (let i = 0; i < members.length; i++) {
        if (!find(members[i], kvs, (m, k) => m.name.repr === k.memberName.repr)) {
            raise(ErrorMissingMember(members[i].name.repr, structDecl, kvs[0].memberName.location));
        }
    }

    // Check if there are duplicated members
    const valuesSoFar: {[key: string]: AtomicToken} = {};
    for (let i = 0; i < kvs.length; ++i) {
        const member = kvs[i].memberName;
        if (valuesSoFar[member.repr]) {
            raise(ErrorDuplicatedMember(member, valuesSoFar[member.repr]));
        }
        valuesSoFar[member.repr] = member;
    }
}

export function findMemberType(key: AtomicToken, structDecl: StructDeclaration): TypeExpression {
    const members = flattenLinkedNode(structDecl.members);
    const matchingMember = members.filter((x) => x.name.repr === key.repr);
    if (matchingMember.length > 0) {
        return matchingMember[0].expectedType;
    } else {
        raise(ErrorAccessingInexistentMember(structDecl, key));
    }
}
export function getStruct(name: AtomicToken, structTab: StructTable): StructDeclaration {
    const result = structTab[name.repr];
    if (result !== undefined) {
        return result;
    } else {
        raise(ErrorUsingUndefinedStruct(name, structTab));
    }
}

export function fillUpKeyValueListTypeInfo(k: LinkedNode<KeyValue>, symbols: SymbolTable)
    : [LinkedNode<KeyValue>, SymbolTable] {
    let current: LinkedNode<KeyValue> | null = k;
    while (current !== null) {
        [current.current.expression, symbols] = fillUpExpressionTypeInfo(current.current.expression, symbols);
        current = current.next;
    }
    return [k, symbols];
}

export function fillUpVariableTypeInfo(e: Variable, vtab: VariableTable): Variable {
    e.returnType = vtab[e.repr].returnType;
    return e;
}

export type SimpleExpression
    = NumberExpression
    | StringExpression
    | BooleanExpression
    ;

export function fillUpSimpleTypeInfo(e: SimpleExpression, name: string): SimpleExpression {
    return {
        ...e,
        returnType: {
            kind: "SimpleType",
            name: {
                repr: name,
                location: NullTokenLocation(),
            },
            nullable: false,
            location: NullTokenLocation()
        }
    };
}

export function fillUpFunctionCallTypeInfo(e: FunctionCall, symbols: SymbolTable):
    [FunctionCall, FunctionTable] {
    for (let i = 0; i < e.parameters.length; i++) {
        [e.parameters[i], symbols] = fillUpExpressionTypeInfo(e.parameters[i], symbols);
    }
    return getFuncSignature(e, symbols.functab, symbols.typeTree);
}

export function getFuncSignature(f: FunctionCall, functab: FunctionTable, typetree: TypeTree)
    : [FunctionCall, FunctionTable] {
    const key = stringifyFuncSignature(f.signature);
    if (key in functab) {
        const matchingFunctions = functab[key];
        const closestFunction = getClosestFunction(f, matchingFunctions, typetree);
        if (closestFunction !== null) {
            // This step is necessary to fix parent type
            // E.g., changing (Number -> Number) to (Any -> Number)
            for (let j = 0; j < f.parameters.length; j++) {
                f.parameters[j].returnType =
                   closestFunction.parameters[j].typeExpected;
            }
            f.returnType = closestFunction.returnType;
            functab = newFunctionTable(closestFunction, functab) ;
            return [f, functab];
        } else {
            raise(ErrorNoConformingFunction(f, matchingFunctions, CURRENT_SOURCE_CODE()));
        }
    } else {
        raise(ErrorUsingUnknownFunction(f));
    }
}

export function getClosestFunction(
    f: FunctionCall,
    matchingFunctions: FunctionDeclaration[],
    typeTree: TypeTree
): FunctionDeclaration | null {
    let closestFunction: FunctionDeclaration | null = null;
    let minimumDistance = Number.MAX_VALUE;
    for (let i = 0; i < matchingFunctions.length; i++) {
        const currentFunc = copy(matchingFunctions[i]);
        const matchingParams = f.parameters;
        if (containsGeneric(currentFunc.parameters)) {
            currentFunc.parameters = substituteGeneric(currentFunc.parameters, matchingParams);
            currentFunc.returnType = substitute(matchingParams[0].returnType, currentFunc.returnType);
        }
        const [distance, error] = paramTypesConforms(currentFunc.parameters, matchingParams, typeTree);
        if (error !== null) {
            raise(ErrorNoConformingFunction(
                f,
                error.paramPosition,
                matchingParams[error.paramPosition],
                matchingFunctions.map((x) => x.parameters[error.paramPosition].typeExpected),
            ));
        } else if (distance < minimumDistance) {
            closestFunction = currentFunc;
            minimumDistance = distance;
        }
    }
    // more than 99 means no matching parent
    return closestFunction || null;
}

export function paramTypesConforms(
    expectedParams: VariableDeclaration[],
    actualParams: Expression[],
    typeTree: TypeTree
): [number, {paramPosition: number /*zero-based*/}|null] {
    let resultScore = 0;
    for (let i = 0; i < expectedParams.length; i++) {
        const expectedType = expectedParams[i].typeExpected;
        const actualType = actualParams[i].returnType;
        if (typeEquals(expectedType, actualType)) {
            resultScore += 0;
        } else {
            const score = childOf(actualType, expectedType, typeTree);
            if (score !== null) {
                resultScore += score;
            } else {
                 return [99, {
                    paramPosition: i
                }];
            }
        }
    }
    return [resultScore, null];
}

function containsGeneric(params: VariableDeclaration[]): boolean {
    return params.some((x) => JSON.stringify(x).indexOf("GenericType") > -1);
}

function substituteGeneric(actualParams: VariableDeclaration[], matchingParams: Expression[]): VariableDeclaration[] {
    const typeOfFirstParam = matchingParams[0].returnType;
    for (let i = 0; i < actualParams.length; i++) {
        actualParams[i].typeExpected = substitute(typeOfFirstParam, /*into*/ actualParams[i].typeExpected);
    }
    return actualParams;

}

function substitute(src: TypeExpression, /*into*/ dest: TypeExpression): TypeExpression {
    const matchingType = (() => {
        let current = src;
        while (current.kind === "CompoundType") {
            current = current.of.current;
        }
        return current;
    })();
    switch (dest.kind) {
        case "CompoundType":
            dest.of.current = substitute(matchingType, dest.of.current);
            break;
        case "GenericType":
            return matchingType;
            break;
        case "SimpleType":
            // do nothing
            break;
    }
    return dest;
}

export function fillUpArrayTypeInfo(e: ListExpression, symbols: SymbolTable): ListExpression {
    if (e.elements !== null) {
        [e.elements, symbols] = fillUpElementsType(e.elements, symbols);
        e.returnType = getElementsType(e.elements);
    } else {
        throw new Error("Don't know how to handle yet");
    }
    return e;
}

export function fillUpElementsType(e: LinkedNode<Expression>, symbols: SymbolTable):
    [LinkedNode<Expression>, SymbolTable] {
    let current: LinkedNode<Expression> | null = e;
    while (current !== null) {
        [current.current, symbols] = fillUpExpressionTypeInfo(current.current, symbols);
        current = current.next;
    }
    return [e, symbols];
}

export function getElementsType(a: LinkedNode<Expression>): CompoundType {
    const types = flattenLinkedNode(a).map((x) => x.returnType);
    checkIfAllElementTypeAreHomogeneous(types);
    return {
        kind: "CompoundType",
        name: {
            repr: "List",
            location: NullTokenLocation()
        },
        of: {
            current: types[0],
            next: null
        },
        nullable: false,
        location: NullTokenLocation()
    };
}

export function checkIfAllElementTypeAreHomogeneous(ts: TypeExpression[]): void {
    if (ts.some((x) => !typeEquals(x, ts[0]))) {
        throw new Error("Every element in an array should have the same type");
    }
    // TODO: Check if every element is of the same type
}

export function typeEquals(x: TypeExpression, y: TypeExpression): boolean {
    return stringifyType(x) === stringifyType(y);
}

function copy<T>(x: T): T {
    return JSON.parse(JSON.stringify(x));
}

function getText(sourceCode: SourceCode, range: TokenLocation): string {
    const lines = sourceCode.content.split("\n").slice(range.first_line - 1, range.last_line);
    if (lines.length === 1) {
        return lines[0].slice(range.first_column - 1, range.last_column);
    } else {
        return lines.join("\n");
    }
}

export type SourceCodeExtractor = (x: TokenLocation) => string;
