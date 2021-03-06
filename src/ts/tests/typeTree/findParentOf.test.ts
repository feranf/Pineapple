import {expect} from "chai";
import {findParentsOf, insertChild, newTree} from "../../typeTree";
import { numberComparer } from "../testUtil";

describe("find parent of", () => {
    it("case 1", () => {
        let tree = newTree(1);
        tree = insertChild(2, /*as child of*/ 1, /*in*/ tree, /*using*/ numberComparer);
        const result = findParentsOf(2, /*in*/ tree, /*using*/ numberComparer);
        expect(result).to.deep.eq([1]);
    });

    it("case 2", () => {
        const tree = newTree(1);
        const result = findParentsOf(1, /*in*/ tree, numberComparer);
        expect(result).to.deep.eq([]);
    });

    it("multiple child", () => {
        let tree = newTree(0);
        tree = insertChild(1, /*as child of*/ 0, /*in*/ tree, numberComparer);
        tree = insertChild(2, /*as child of*/ 0, /*in*/ tree, numberComparer);
        const result = findParentsOf(1, /*in*/ tree, numberComparer);
        expect(result).to.deep.eq([0]);
    });
});
