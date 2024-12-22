import { Container as PixiContainer, DisplayObject as PixiDisplayObject, Sprite as PixiSprite, Graphics as PixiGraphics, Filter as PixiFilter } from 'pixi.js';
import { CoreEngine } from '../core-engine';
import { Point } from './point';

const setAlphaFromParentToChildren = (container: PixiContainer, newAlpha: number) => {
    const children = container.children;
    container.alpha = newAlpha;
    if (children && children.length > 0) {
        children.forEach(child => {
            if ('children' in child) {
                setAlphaFromParentToChildren(child, newAlpha);
            }
        });
    }
};

const applyFromParentToChildren = (container: PixiContainer, onApplyInChildren: (childContainer: PixiContainer) => void) => {
    const children = container.children;
    onApplyInChildren(container);
    if (children && children.length > 0) {
        children.forEach(child => {
            if ('children' in child) {
                applyFromParentToChildren(child, onApplyInChildren);
            }
        });
    }
};

export class Container {
    protected container: PixiContainer;
    protected containerParent: Container;
    protected currentPosition: Point;
    protected currentScale: Point;

    constructor(pixiContainer?: PixiContainer, notUseConstructor: boolean = false) {
        if (!notUseConstructor) {
            if (pixiContainer) {
                this.container = pixiContainer;
            } else {
                const isPixiWebGl = CoreEngine.getInstance().isPixiWebGl;
                this.buildContainer(isPixiWebGl);
            }
        }
    }

    static swapParents(containerA: Container, containerB: Container) {
        const parentA = containerA.containerPixiWebGl.parent;
        containerA.containerPixiWebGl.setParent(containerB.containerPixiWebGl.parent);
        containerB.containerPixiWebGl.setParent(parentA);
    }

    static parseAfterEffectsToContainer(container: any): Container | undefined {
        if (CoreEngine.getInstance().isPixiWebGl) {
            return new Container(container);
        }
        return undefined;
    }

    get containerPixiWebGl(): PixiContainer {
        return this.container;
    }

    get x() {
        if (!this.currentPosition) {
            this.currentPosition = new Point(this.container.position.x, this.container.position.y);
        }
        return this.currentPosition.x;
    }

    get y() {
        if (!this.currentPosition) {
            this.currentPosition = new Point(this.container.position.x, this.container.position.y);
        }
        return this.currentPosition.y;
    }

    get position() {
        if (!this.currentPosition) {
            this.currentPosition = new Point(this.container.position.x, this.container.position.y);
        }
        return this.currentPosition;
    }

    get scale() {
        if (!this.currentScale) {
            this.currentScale = new Point(this.container.scale.x, this.container.scale.y);
        }
        return this.currentScale;
    }

    get scaleX() {
        if (!this.currentScale) {
            this.currentScale = new Point(this.container.scale.x, this.container.scale.y);
        }
        return this.currentScale.x;
    }

    get scaleY() {
        if (!this.currentScale) {
            this.currentScale = new Point(this.container.scale.x, this.container.scale.y);
        }
        return this.currentScale.y;
    }

    get height() {
        return this.container.height;
    }

    get width() {
        return this.container.width;
    }

    get alpha() {
        return this.container.alpha;
    }

    get rotation() {
        return this.container.rotation;
    }

    get visible() {
        return this.container.visible;
    }

    get renderable() {
        return this.container.renderable;
    }

    get parent() {
        if (!this.containerParent) {
            this.containerParent = new Container(this.container.parent);
        }
        return this.containerParent;
    }

    set position(value: Point) {
        if (!this.currentPosition) {
            this.currentPosition = new Point(value.x, value.y);
        } else {
            this.currentPosition.set(value.x, value.y);
        }
        this.container.position.set(value.x, value.y);
    }

    set x(value: number) {
        if (!this.currentPosition) {
            this.currentPosition = new Point(value, this.container.y);
        } else {
            this.currentPosition.x = value;
        }
        this.container.x = value;
    }

    set y(value: number) {
        if (!this.currentPosition) {
            this.currentPosition = new Point(this.container.x, value);
        } else {
            this.currentPosition.y = value;
        }
        this.container.y = value;
    }

    set scaleX(value: number) {
        if (!this.currentScale) {
            this.currentScale = new Point(value, this.container.scale.y);
        } else {
            this.currentScale.x = value;
        }
        this.container.scale.x = this.currentScale.x;
    }

    set scaleY(value: number) {
        if (!this.currentScale) {
            this.currentScale = new Point(this.container.scale.x, value);
        } else {
            this.currentScale.y = value;
        }
        this.container.scale.y = this.currentScale.y;
    }

    set scale(value: Point) {
        if (!this.currentScale) {
            this.currentScale = new Point(value.x, value.y);
        } else {
            this.currentScale.set(value.x, value.y);
        }
        this.container.scale.set(this.currentScale.x, this.currentScale.y);
    }

    set height(value: number) {
        this.container.height = value;
    }

    set width(value: number) {
        this.container.width = value;
    }

    set alpha(value: number) {
        this.container.alpha = value;
    }

    set visible(value: boolean) {
        this.container.visible = value;
    }

    set renderable(value: boolean) {
        this.container.renderable = value;
    }

    set rotation(value: number) {
        this.container.rotation = value;
    }

    set filters(filterList: PixiFilter[]) {
        this.container.filters = filterList;
    }

    set mask(mask: Container | null) {
        if (mask !== null) {
            if (mask.containerPixiWebGl instanceof PixiSprite || mask.containerPixiWebGl instanceof PixiGraphics) {
                this.container.mask = mask.containerPixiWebGl;
            }
        } else {
            (<any> this.container.mask) = null;
        }
    }

    get numberOfChildrens() {
        return this.container.children.length;
    }

    isEquals(container: Container): boolean {
        return this.container === container.containerPixiWebGl;
    }

    getChildrenAt(index: number): Container | undefined {
        const displayObject = this.container.children[index];
        if (displayObject instanceof PixiContainer) {
            return new Container(<PixiContainer> displayObject);
        }
    }

    updateTransform() {
        if (this.container.parent) {
            this.container.updateTransform();
        }
    }

    setParent(value: Container): Container {
        if (!this.containerParent) {
            this.containerParent = new Container(value.container.parent);
        } else {
            this.containerParent.container = value.container.parent;
        }
        this.container.setParent(value.container.parent);
        return this.containerParent;
    }

    removeChild(container: Container) {
        this.container.removeChild(container.container);
    }

    removeChildren(beginIndex?: number, endIndex?: number) {
        this.container.removeChildren(beginIndex, endIndex);
    }

    addChild(container: Container) {
        this.container.addChild(container.container);
    }

    destroy(options?: {
        children?: boolean;
        texture?: boolean;
        baseTexture?: boolean;
    }): void {
        this.container.destroy(options);
    }

    isASprite() {
        return this.container instanceof PixiSprite;
    }

    setAlphaFromParentToChildren(newAlpha: number) {
        setAlphaFromParentToChildren(this.container, newAlpha);
    }

    setVisibleChildren(visible: boolean) {
        if (this.container.children && this.container.children.length > 0) {
            this.container.children.forEach(contChild => {
                if ('children' in contChild) {
                    applyFromParentToChildren(contChild, child => child.visible = visible);
                }
            });
        }
    }

    clearEmptyChilds() {
        if (this.container.children && this.container.children.length > 0) {
            const listIndexToRemove: number[] = [];
            this.container.children.forEach((child, index) => {
                if ('children' in child && (<PixiContainer> child).children.length === 0) {
                    listIndexToRemove.push(index);
                }
            });
            listIndexToRemove.reverse();
            listIndexToRemove.forEach(childIndex => {
                this.container.removeChildAt(childIndex);
            });
        }
    }

    private buildContainer(isPixiWebGl: boolean) {
        if (isPixiWebGl) {
            this.container = new PixiContainer();
        }
    }
}
