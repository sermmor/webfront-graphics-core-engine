import { Container } from 'pixi.js';

export class ElementFinder {
    findByName(name: string, node: Container): Container[] {
        const nodeMap: { [key: string]: any } = {};
        this.privateFindByName(name, node).forEach(subnode => {
            //   nodeMap[subnode] = subnode;
            nodeMap[name] = subnode;
        });
        return Object.values(nodeMap) || [];
    }

    privateFindByName(name: string, node: Container): Container[] {
        const foundNodes = [];
        if (node.name === name) {
            foundNodes.push(node);
        }
        node.children.forEach((child: Container) => {
            if (child.name === name) {
                foundNodes.push(child);
            }
            this.privateFindByName(name, child).forEach((subnode: Container) => {
                foundNodes.push(subnode);
            });
        });
        return foundNodes;
    }
}
