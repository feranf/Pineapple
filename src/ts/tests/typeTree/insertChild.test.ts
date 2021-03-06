import {expect} from "chai";
import {
    findParentsOf,
    insertChild,
    newTree
} from "../../typeTree";
import { numberComparer } from "../testUtil";

describe("insertChild", () => {
    it("case 1", () => {
        let tree = newTree(1);
        tree = insertChild(2, 1, tree, numberComparer);
        tree = insertChild(3, 2, tree, numberComparer);
        tree = insertChild(4, 2, tree, numberComparer);
        tree = insertChild(5, 1, tree, numberComparer);
        const parent = findParentsOf(3, tree, numberComparer);
        expect(parent).to.deep.eq([2]);
    });

    it("case 2", () => {
        let tree = newTree(1);
        tree = insertChild(2, 1, tree, numberComparer);
        tree = insertChild(3, 1, tree, numberComparer);
        tree = insertChild(4, 2, tree, numberComparer);
        const parent = findParentsOf(4, tree, numberComparer);
        expect(parent).to.deep.eq([2]);
    });

    it.skip("inserting element as child of unexisting parent", () => {
        let tree = newTree(1);
        expect(() => {
            tree = insertChild(2, /* as child of */ 3, tree, numberComparer);
        }).to.throw();
    });

    it.skip("inserting duplicated elements", () => {
        const tree = newTree(1);
        expect(() => {
            insertChild(1, 1, tree, numberComparer);
        }).to.throw();
    });

});
