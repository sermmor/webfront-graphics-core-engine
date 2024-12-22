import { Point, DisplayObject, Graphics } from 'pixi.js';
import { bezier as BezierEasing } from '../../bezier/bezier-easing';
import {
    Element,
    ElementData,
    Transform,
    AnimatedData,
    MultiDimensional,
    MultiDimensionalKeyframed,
    Value,
    ValueKeyframed,
    ValueKeyframe,
    AnimationPoint,
    OffsetKeyframe
} from './element';

export enum LineCap {
    round = 2,
    butt = 1,
    square = 3
}
export enum LineJoin {
    round = 2,
    miter = 1,
    bevel = 3
}

export interface GroupElement {
    closed: boolean;
    nm: string;
    mn: string;
    ty: string;
    np: number;
    it: GroupItem[];
}

export type GroupItem = PathItem | StrokeItem | TrimItem | RectangleItem | EllipseItem | Transform;
export type ShapeItem = RectangleForShape | EllipseForShape;

export interface PathItem {
    m: any;
    e: any;
    nm: string;
    mn: string;
    d: number;
    ty: string;
    closed: boolean;
    ks: PropertiesShape | PropsShapeKeyframed;
}

export interface StrokeItem {
    mn: string;
    nm: string;
    ty: string;
    lc: LineCap;
    lj: LineJoin;
    ml: number;
    o: Value | ValueKeyframed;
    w: Value | ValueKeyframed;
    c: MultiDimensional | MultiDimensionalKeyframed;
    fillEnabled: boolean;
}

export interface TrimItem {
    m: any;
    o: Value | ValueKeyframed;
    nm: string;
    mn: string;
    ty: string;
    s: Value | ValueKeyframed;
    e: Value | ValueKeyframed;
}

export interface RectangleItem {
    mn: string;
    nm: string;
    ty: string;
    d: number;
    p: MultiDimensional | MultiDimensionalKeyframed;
    s: MultiDimensional | MultiDimensionalKeyframed;
    r: Value | ValueKeyframed;
}

export interface EllipseItem {
    mn: string;
    nm: string;
    d: number;
    ty: string;
    p: MultiDimensional | MultiDimensionalKeyframed;
    s: MultiDimensional | MultiDimensionalKeyframed;
}

export interface FillItem {
    mn: string;
    nm: string;
    ty: string;
    o: Value | ValueKeyframed;
    c: MultiDimensional | MultiDimensionalKeyframed;
}

export interface PropsShapeKeyframed {
    n: string[];
    s: (ShapeProp | PropsShapeKeyframed[])[];
    e: (ShapeProp | PropsShapeKeyframed[])[];
    t: number;
    i: { x: number; y: number };
    o: { x: number; y: number };
}

export interface PropertiesShape {
    k: ShapeProp | PropsShapeKeyframed[];
    x: string;
    ix: string;
    a: number;
}

export interface ShapeProp {
    c: boolean;
    i: number[][];
    o: number[][];
    v: number[][];
}

export interface ShapePath {
    isClosed: boolean;
    name: string;
    path: PathForShape;
}

export interface PathForShape {
    moveTo?: Point;
    bezierCurveToPaths?: {
        cp: Point;
        cp2: Point;
        to: Point;
    }[];
    hasAnimatedPath?: boolean;
    paths?: AnimatedData[];
    isClosed?: boolean;
}

export interface StrokeForShape {
    miterLimit: number;
    opacity: number | Value | ValueKeyframed | ValueKeyframe[];
    width: number | ValueKeyframe[];
    color: string | AnimatedData[];
    enabledFill: boolean;
    lineJoin: number;
    lineCap: number;
}

export interface TrimForShape {
    m: any;
    o: Value | ValueKeyframed;
    name: string;
    start: number | AnimatedData[];
    end: number | AnimatedData[];
    enabledAnimation?: boolean;
}

export interface RectangleForShape {
    name: string;
    direction: number;
    position: AnimatedData[] | Point | AnimationPoint;
    size: AnimatedData[] | Point | AnimationPoint;
    enabledAnimation?: boolean;
}

export interface EllipseForShape {
    direction: number;
    position: AnimatedData[] | Point | AnimationPoint;
    size: AnimatedData[] | Point | AnimationPoint;
    enabledAnimation?: boolean;
}

export interface FillForShape {
    name?: string;
    opacity?: number | AnimatedData[];
    color?: string | AnimatedData[];
    enabled: boolean;
}

export class ShapeElement extends Element {
    shapePaths: ShapePath[];
    stroke: StrokeForShape;
    trim: TrimForShape;
    rects: RectangleForShape[];
    ellipses: EllipseForShape[];
    fillRGBA: FillForShape;
    strokeColorHex: string | undefined;
    fillColorHex: string | undefined;
    isClosed: boolean;
    paths: AnimatedData[];

    constructor(data?: GroupItem | GroupElement, inFrame?: number, outFrame?: number, startTime?: number) {
        super();
        if (!data) {
            return;
        }
        this.name = data.nm!;
        this.type = data.ty!;
        this.inFrame = <number>inFrame;
        this.outFrame = <number>outFrame;
        this.startTime = <number>startTime;
        // if (!data.it) {
        if (!('it' in data)) {
            this.setupShapeByType(data);
        } else {
            this.setupShapeIteration(data.it);
        }
        this.drawThis(0);
    }

    static createTrim(data: number | ValueKeyframe[]): number | AnimatedData[] {
        if (typeof data === 'number') {
            return data;
        }
        return ShapeElement.createTrimAnimation(data);
    }

    static createTrimEasing(animData: ValueKeyframe): ((x: number) => number) {
        if (animData.i && animData.o) {
            return BezierEasing(
                (<number[]>animData.o.x)[0],
                (<number[]>animData.o.y)[0],
                (<number[]>animData.i.x)[0],
                (<number[]>animData.i.y)[0]
            );
        }
        return x => x;
    }

    static createTrimAnimation(data: ValueKeyframe[]): AnimatedData[] {
        const lastIndex = data.length - 1;
        return data.map((animData, index) => {
            return {
                name: animData.n,
                startFrame: animData.t,
                endFrame: lastIndex > index ? data[index + 1].t : animData.t,
                easing: ShapeElement.createTrimEasing(animData),
                fromRatio: animData.s ? (<number[]>animData.s)[0] : null,
                toRatio: animData.e ? (<number[]>animData.e)[0] : null
            };
        });
    }

    static createSize(data: MultiDimensional | MultiDimensionalKeyframed): Point | AnimationPoint | AnimatedData[] {
        return ShapeElement.createPosition(data);
    }

    static createColor(data: MultiDimensional | MultiDimensionalKeyframed): string | AnimatedData[] {
        if (typeof data.k[0] === 'number') {
            return ShapeElement.rgbArrayToHex(<number[]>data.k);
        }
        return ShapeElement.createAnimatedColor(<OffsetKeyframe[]>data.k);
    }

    static createColorEasing(animData: OffsetKeyframe): ((x: number) => number) {
        if (animData.i && animData.o) {
            return BezierEasing(<number>animData.o.x, <number>animData.o.y, <number>animData.i.x, <number>animData.i.y);
        }
        return x => x;
    }

    static createAnimatedColor(data: OffsetKeyframe[]): AnimatedData[] {
        const lastIndex = data.length - 1;
        return data.map((animData: OffsetKeyframe, index) => {
            return {
                name: animData.n,
                startFrame: animData.t,
                endFrame: lastIndex > index ? data[index + 1].t : animData.t,
                easing: ShapeElement.createColorEasing(animData),
                fromColor: animData.s ? ShapeElement.rgbArrayToHex(animData.s) : '0x000000',
                toColor: animData.e ? ShapeElement.rgbArrayToHex(<number[]>animData.e) : '0x000000'
            };
        });
    }

    static createPathEasing(animData: PropsShapeKeyframed): ((x: number) => number) {
        if (animData.i && animData.o) {
            return BezierEasing(animData.o.x, animData.o.y, animData.i.x, animData.i.y);
        }
        return x => x;
    }

    static rgbArrayToHex(arr: number[]): string {
        return ShapeElement.rgbToHex(arr[0], arr[1], arr[2]);
    }

    static rgbToHex(r: number, g: number, b: number): string {
        const toHex = ShapeElement.toHex;
        return `0x${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    static toHex(c: number): string {
        if (c <= 1) {
            c *= 255;
            c = Math.floor(c);
        }
        const hex = c.toString(16);
        return hex.length === 1 ? `0${hex}` : hex;
    }

    static createAnimatePos(
        animData: AnimatedData,
        frame: number,
        fromPos: { x: number; y: number },
        toPos: { x: number; y: number }
    ): Point {
        const totalFrame = animData.endFrame - animData.startFrame;
        const playFrame = (frame - animData.startFrame) * 1.0;
        const posDiffX = toPos.x - fromPos.x;
        const posDiffY = toPos.y - fromPos.y;
        const playRatio = playFrame / totalFrame;
        const posRatio = animData.easing(playRatio);
        const posX = posDiffX * posRatio + fromPos.x;
        const posY = posDiffY * posRatio + fromPos.y;
        return new Point(posX, posY);
    }

    static createAnimatePath(animData: AnimatedData, frame: number): PathForShape {
        const fromPath = animData.fromPath!;
        const toPath = animData.toPath!;
        return {
            moveTo: ShapeElement.createAnimatePos(animData, frame, fromPath!.moveTo!, toPath!.moveTo!),
            bezierCurveToPaths: fromPath!.bezierCurveToPaths!.map((path, index) => {
                const fromBezierCurveToPath = fromPath!.bezierCurveToPaths![index];
                const toBezierCurveToPath = toPath!.bezierCurveToPaths![index];
                const cp = ShapeElement.createAnimatePos(animData, frame, fromBezierCurveToPath.cp, toBezierCurveToPath.cp);
                const cp2 = ShapeElement.createAnimatePos(animData, frame, fromBezierCurveToPath.cp2, toBezierCurveToPath.cp2);
                const to = ShapeElement.createAnimatePos(animData, frame, fromBezierCurveToPath.to, toBezierCurveToPath.to);
                return { cp, cp2, to };
            })
        };
    }

    static createShapePosition(frame: number, shape: ShapeItem): AnimatedData[] | AnimationPoint | Point | null | undefined {
        if ('length' in shape.position && shape.position.length > 0) {
            const position: AnimatedData[] = <AnimatedData[]>shape.position;
            let pos = null;
            position.forEach((animData: AnimatedData) => {
                if (animData.startFrame <= frame && frame <= animData.endFrame) {
                    const posDiffX = (<number[]>animData.toPosition)[0] - (<number[]>animData.fromPosition)[0];
                    const posDiffY = (<number[]>animData.toPosition)[1] - (<number[]>animData.fromPosition)[1];
                    const totalFrame = animData.endFrame - animData.startFrame;
                    const playFrame = (frame - animData.startFrame) * 1.0;
                    const playRatio = playFrame / totalFrame;
                    const posRatio = animData.easing(playRatio);
                    const posX = posDiffX * posRatio + (<number[]>animData.fromPosition)[0];
                    const posY = posDiffY * posRatio + (<number[]>animData.fromPosition)[1];
                    pos = new Point(posX, posY);
                }
            });
            const lastPos = position[position.length - 2];
            if (frame > lastPos.endFrame) {
                pos = lastPos.toPos;
            }
            return pos;
        }
        return shape.position;
    }

    static createShapeSize(frame: number, shape: ShapeItem) {
        if ('length' in shape.size && shape.size.length > 0) {
            const position: AnimatedData[] = <AnimatedData[]>shape.position;
            let size = null;
            shape.size.forEach(animData => {
                if (animData.startFrame <= frame && frame <= animData.endFrame) {
                    const sizeDiffW = (<number[]>animData.toPosition)[0] - (<number[]>animData.fromPosition)[0];
                    const sizeDiffH = (<number[]>animData.toPosition)[1] - (<number[]>animData.fromPosition)[1];
                    const totalFrame = animData.endFrame - animData.startFrame;
                    const playFrame = (frame - animData.startFrame) * 1.0;
                    const playRatio = playFrame / totalFrame;
                    const sizeRatio = animData.easing(playRatio);
                    const sizeWidth = sizeDiffW * sizeRatio + (<number[]>animData.fromPosition)[0];
                    const sizeHeight = sizeDiffH * sizeRatio + (<number[]>animData.fromPosition)[1];
                    size = new Point(sizeWidth, sizeHeight);
                }
            });
            const lastSize = shape.size[shape.size.length - 2];
            if (frame > lastSize.endFrame) {
                size = lastSize.toPos;
            }
            return size;
        }
        return shape.size;
    }

    setupShapeByType(data: GroupItem): void {
        switch (data.ty) {
            case 'sh':
                this.setupPath(<PathItem>data);
                break;
            case 'st':
                this.setupStroke(<StrokeItem>data);
                break;
            case 'tm':
                this.setupTrim(<TrimItem>data);
                break;
            case 'rc':
                this.setupRect(<RectangleItem>data);
                break;
            case 'el':
                this.setupEllipse(<EllipseItem>data);
                break;
            case 'fl':
                this.setupFill(<FillItem>data);
                break;
            case 'tr':
                this.setupProperties(<Transform>data);
                break;
            default:
                break;
        }
    }

    setupShapeIteration(data: (GroupItem)[]): void {
        data.forEach((def: GroupItem) => {
            this.setupShapeByType(def);
        });
        if (this.shapePaths) {
            this.shapePaths.reverse();
        }
    }

    setupPath(data: PathItem): void {
        if (!this.shapePaths) {
            this.shapePaths = [];
        }
        this.isClosed = data.closed;
        const shapePath: ShapePath = {
            isClosed: data.closed,
            name: data.nm,
            path: this.createPath((<PropertiesShape>data.ks).k)
        };
        this.shapePaths.push(shapePath);
    }

    setupStroke(data: StrokeItem): void {
        const stroke: StrokeForShape = {
            lineCap: data.lc,
            lineJoin: data.lj,
            miterLimit: data.ml,
            opacity: data.o!.k,
            width: data.w.k,
            color: ShapeElement.createColor(data.c),
            enabledFill: data.fillEnabled
        };
        this.stroke = stroke;
    }

    setupTrim(data: TrimItem): void {
        const trim: TrimForShape = {
            m: data.m,
            o: data.o,
            name: data.nm,
            start: ShapeElement.createTrim(data.s.k),
            end: ShapeElement.createTrim(data.e.k)
        };
        if (!(typeof trim.start === 'number') && trim.start.length > 0) {
            trim.enabledAnimation = true;
        }
        this.trim = trim;
    }

    setupRect(data: RectangleItem): void {
        if (!this.rects) {
            this.rects = [];
        }
        const rect: RectangleForShape = {
            name: data.nm,
            direction: data.d,
            position: ShapeElement.createPosition(data.p),
            size: ShapeElement.createSize(data.s)
        };
        if ((<AnimatedData[]>rect.position).length > 0 || (<AnimatedData[]>rect.size).length > 0) {
            rect.enabledAnimation = true;
        }
        this.rects.push(rect);
    }

    setupEllipse(data: EllipseItem): void {
        if (!this.ellipses) {
            this.ellipses = [];
        }
        const ellipse: EllipseForShape = {
            direction: data.d,
            position: ShapeElement.createPosition(data.p),
            size: ShapeElement.createSize(data.s)
        };
        if ((<AnimatedData[]>ellipse.position).length > 0 || (<AnimatedData[]>ellipse.size).length > 0) {
            ellipse.enabledAnimation = true;
        }
        this.ellipses.push(ellipse);
    }

    createPathByAnimation(data: PropsShapeKeyframed[]): PathForShape {
        const lastIndex = data.length - 1;
        return {
            hasAnimatedPath: true,
            isClosed: this.isClosed,
            paths: data.map((animData, index) => {
                return {
                    name: animData.n,
                    startFrame: animData.t,
                    endFrame: lastIndex > index ? data[index + 1].t : animData.t,
                    easing: ShapeElement.createPathEasing(animData),
                    fromPath: animData.s ? this.createPath(animData.s[0]) : null,
                    toPath: animData.e ? this.createPath(animData.e[0]) : null
                };
            })
        };
    }

    createPath(data: ShapeProp | PropsShapeKeyframed[]): PathForShape {
        // if (!data.v) return this.createPathByAnimation(data);
        if (!('v' in data)) {
            return this.createPathByAnimation(data);
        }

        // TODO: more smartly clone data
        data = JSON.parse(JSON.stringify(data));
        const dataSP: ShapeProp = <ShapeProp>data;

        const path: PathForShape = {};
        dataSP.v.forEach((_v, index) => {
            dataSP.i[index][0] += dataSP.v[index][0];
            dataSP.i[index][1] += dataSP.v[index][1];
            dataSP.o[index][0] += dataSP.v[index][0];
            dataSP.o[index][1] += dataSP.v[index][1];
            if (index === 0) {
                return;
            }
            const cp = dataSP.o[index - 1];
            const cp2 = dataSP.i[index];
            const to = dataSP.v[index];
            if (index === 1) {
                path.moveTo = new Point(dataSP.v[0][0], dataSP.v[0][1]);
            }
            if (!path.bezierCurveToPaths) {
                path.bezierCurveToPaths = [];
            }
            path.bezierCurveToPaths.push({
                cp: new Point(cp[0], cp[1]),
                cp2: new Point(cp2[0], cp2[1]),
                to: new Point(to[0], to[1])
            });
        });
        path.bezierCurveToPaths!.push({
            cp: new Point(dataSP.o[dataSP.v.length - 1][0], dataSP.o[dataSP.v.length - 1][1]),
            cp2: new Point(dataSP.i[0][0], dataSP.i[0][1]),
            to: new Point(dataSP.v[0][0], dataSP.v[0][1])
        });
        return path;
    }

    setupFill(data: FillItem): void {
        const fill: FillForShape = {
            color: ShapeElement.createColor(data.c),
            enabled: true,
            name: data.nm,
            opacity: ShapeElement.createOpacity(data.o)
        };
        this.fillRGBA = fill;
    }

    updateAnimationFrameByBaseFrame(animBaseFrame: number): void {
        super.updateAnimationFrameByBaseFrame(animBaseFrame);
        if (!this.shapePaths) {
            return;
        }
        this.shapePaths.forEach((shapePath: ShapePath) => {
            if (!shapePath.path.hasAnimatedPath) {
                return;
            }
            shapePath.path.paths!.forEach((animData: AnimatedData) => {
                animData.startFrame += animBaseFrame;
                animData.endFrame += animBaseFrame;
            });
        });
        if (this.ellipses) {
            this.ellipses.forEach(ellipse => {
                if (!ellipse.enabledAnimation) {
                    return;
                }

                if ((<AnimatedData[]>ellipse.size).length > 0) {
                    (<AnimatedData[]>ellipse.size).forEach(animData => {
                        animData.startFrame += animBaseFrame;
                        animData.endFrame += animBaseFrame;
                    });
                }
                if ((<AnimatedData[]>ellipse.position).length > 0) {
                    (<AnimatedData[]>ellipse.position).forEach(animData => {
                        animData.startFrame += animBaseFrame;
                        animData.endFrame += animBaseFrame;
                    });
                }
            });
        }
        if (this.rects) {
            this.rects.forEach(rect => {
                if (!rect.enabledAnimation) {
                    return;
                }

                if ((<AnimatedData[]>rect.size).length > 0) {
                    (<AnimatedData[]>rect.size).forEach(animData => {
                        animData.startFrame += animBaseFrame;
                        animData.endFrame += animBaseFrame;
                    });
                }
                if ((<AnimatedData[]>rect.position).length > 0) {
                    (<AnimatedData[]>rect.position).forEach(animData => {
                        animData.startFrame += animBaseFrame;
                        animData.endFrame += animBaseFrame;
                    });
                }
            });
        }
    }

    drawPathForMask(shapePath: PathForShape): void {
        const moveTo = shapePath.moveTo;
        this.moveTo(moveTo!.x, moveTo!.y);
        shapePath.bezierCurveToPaths!.forEach(path => {
            this.bezierCurveTo(path.cp.x, path.cp.y, path.cp2.x, path.cp2.y, path.to.x, path.to.y);
        });
        this.closePath();
    }

    beforeDraw(): void {
        const fillColorHex = this.fillColorHex === undefined ? undefined : +this.fillColorHex;
        if (this.stroke) {
            const strokeColorHex = this.strokeColorHex === undefined ? undefined : +this.strokeColorHex;
            if (this.stroke.enabledFill) {
                this.beginFill(strokeColorHex);
            } else if (this.fillRGBA) {
                this.beginFill(fillColorHex);
            }
            this.lineStyle(<number>this.stroke.width, strokeColorHex);
            // TODO: ignore miterLimit and lineCap and lineJoin
        } else if (this.fillRGBA) {
            if (this.fillRGBA.enabled) {
                this.beginFill(fillColorHex);
            } else {
                this.lineStyle(2, fillColorHex);
            }
        }
    }

    afterDraw(): void {
        if (!this.isClosed) {
            return;
        }

        if (this.stroke) {
            if (this.stroke.enabledFill) {
                this.endFill();
            } else if (this.fillRGBA) {
                this.endFill();
            } else {
                this.closePath();
            }
        } else if (this.fillRGBA) {
            if (this.fillRGBA.enabled) {
                this.endFill();
            } else {
                this.closePath();
            }
        }
    }

    drawPath(shapePath: PathForShape): void {
        this.beforeDraw();

        this.moveTo(shapePath.moveTo!.x, shapePath.moveTo!.y);
        shapePath.bezierCurveToPaths!.forEach(path => {
            this.bezierCurveTo(path.cp.x, path.cp.y, path.cp2.x, path.cp2.y, path.to.x, path.to.y);
        });

        this.afterDraw();
    }

    setupStrokeColor(frame: number): void {
        if (!this.stroke) {
            return;
        }

        if (typeof this.stroke.color !== 'string') {
            const firstColor = this.stroke.color[0];
            if (frame < firstColor.startFrame) {
                this.strokeColorHex = firstColor.fromColor;
                return;
            }
            this.stroke.color.forEach(animData => {
                if (animData.startFrame <= frame && frame <= animData.endFrame) {
                    this.strokeColorHex = animData.fromColor;
                }
            });
            const lastColor = this.stroke.color[this.stroke.color.length - 2];
            if (frame > lastColor.endFrame) {
                this.strokeColorHex = lastColor.fromColor;
            }
        } else {
            this.strokeColorHex = this.stroke.color;
        }
    }

    setupFillColor(frame: number): void {
        if (!this.fillRGBA) {
            return;
        }

        if (typeof this.fillRGBA.color !== 'string') {
            const firstColor = this.fillRGBA.color![0];
            if (frame < firstColor.startFrame) {
                this.fillColorHex = firstColor.fromColor;
                return;
            }
            this.fillRGBA.color!.forEach((animData: AnimatedData) => {
                if (animData.startFrame <= frame && frame <= animData.endFrame) {
                    this.fillColorHex = animData.fromColor;
                }
            });
            const lastColor = this.fillRGBA.color![this.fillRGBA.color!.length - 2];
            if (frame > lastColor.endFrame) {
                this.fillColorHex = lastColor.toColor;
            }
        } else {
            this.fillColorHex = this.fillRGBA.color;
        }
    }

    drawEllipseAnimation(frame: number, ellipse: EllipseForShape): void {
        const pos: Point = <Point>ShapeElement.createShapePosition(frame, ellipse);
        const size: Point = <Point>ShapeElement.createShapeSize(frame, ellipse);
        if (!pos || !size) {
            return;
        }

        this.drawEllipse(pos.x, pos.y, size.x / 2.0, size.y / 2.0);
    }

    drawRectAnimation(frame: number, rect: RectangleForShape): void {
        const pos: Point = <Point>ShapeElement.createShapePosition(frame, rect);
        const size: Point = <Point>ShapeElement.createShapeSize(frame, rect);
        if (!pos || !size) {
            return;
        }

        this.drawRect(pos.x, pos.y, size.x, size.y);
    }

    drawTrim(frame: number): boolean | undefined {
        if (!this.trim.enabledAnimation) {
            this.beforeDraw();
            this.shapePaths.forEach((shapePath: ShapePath) => {
                const path = shapePath.path;

                const fromPath = path.moveTo;
                const toPath = path!.bezierCurveToPaths![0];
                const xDiff = toPath.to.x - (<Point>fromPath).x;
                const yDiff = toPath.to.y - (<Point>fromPath).y;

                const startX = (<Point>fromPath).x + (xDiff * <number>this.trim.start) / 100;
                const startY = (<Point>fromPath).y + (yDiff * <number>this.trim.start) / 100;
                const endX = (<Point>fromPath).x + (xDiff * <number>this.trim.end) / 100;
                const endY = (<Point>fromPath).y + (yDiff * <number>this.trim.end) / 100;
                this.moveTo(startX, startY);
                this.lineTo(endX, endY);
            });
            this.afterDraw();
            return;
        }

        if (frame < (<AnimatedData[]>this.trim.start)[0].startFrame && frame < (<AnimatedData[]>this.trim.end)[0].startFrame) {
            return;
        }

        let trimStartRatio = 0;
        (<AnimatedData[]>this.trim.start).some((animData: AnimatedData) => {
            if (animData.startFrame === animData.endFrame) {
                return false;
            }
            if (animData.startFrame <= frame && frame <= animData.endFrame) {
                const ratioDiff = <number>animData.toRatio - <number>animData.fromRatio;
                const totalFrame = animData.endFrame - animData.startFrame;
                const playFrame = frame - animData.startFrame;
                const perFrameRatio = (1.0 * ratioDiff) / totalFrame;
                trimStartRatio = playFrame * perFrameRatio + <number>animData.fromRatio;
                return true;
            }
            return false;
        });
        let last = (<AnimatedData[]>this.trim.start)[(<AnimatedData[]>this.trim.start).length - 2];
        if (last.endFrame <= frame) {
            trimStartRatio = <number>last.toRatio;
        }

        let trimEndRatio = 0;
        (<AnimatedData[]>this.trim.end).some(animData => {
            if (animData.startFrame === animData.endFrame) {
                return false;
            }
            if (animData.startFrame <= frame && frame <= animData.endFrame) {
                if (!animData.fromRatio) {
                    return false;
                }
                const ratioDiff = <number>animData.toRatio - animData.fromRatio;
                const totalFrame = animData.endFrame - animData.startFrame;
                const playFrame = frame - animData.startFrame;
                const perFrameRatio = (1.0 * ratioDiff) / totalFrame;
                trimEndRatio = playFrame * perFrameRatio + animData.fromRatio;
                return true;
            }
            return false;
        });
        last = (<AnimatedData[]>this.trim.end)[(<AnimatedData[]>this.trim.end).length - 2];
        if (last.endFrame <= frame) {
            trimEndRatio = <number>last.toRatio;
        }

        if (trimStartRatio > trimEndRatio) {
            const tmp = trimStartRatio;
            trimStartRatio = trimEndRatio;
            trimEndRatio = tmp;
        }
        this.beforeDraw();
        this.shapePaths.forEach((shapePath: ShapePath) => {
            const path = shapePath.path;

            const fromPath = path.moveTo!;
            const toPath = path.bezierCurveToPaths![0];
            const xDiff = toPath.to.x - fromPath.x;
            const yDiff = toPath.to.y - fromPath.y;

            const startX = fromPath.x + (xDiff * trimStartRatio) / 100;
            const startY = fromPath.y + (yDiff * trimStartRatio) / 100;
            const endX = fromPath.x + (xDiff * trimEndRatio) / 100;
            const endY = fromPath.y + (yDiff * trimEndRatio) / 100;
            this.moveTo(startX, startY);
            this.lineTo(endX, endY);
        });
        this.afterDraw();
    }

    drawShapePath(frame: number, shapePath: ShapePath, index: number): boolean | undefined {
        if (shapePath.path.hasAnimatedPath) {
            this.isClosed = shapePath.isClosed;
            const paths = <AnimatedData[]>shapePath.path.paths;
            if (frame < paths[0].startFrame) {
                this.drawPath(<PathForShape>paths[0].fromPath);
                if (index !== 0) {
                    this.endHole();
                }
            }
            (<AnimatedData[]>shapePath.path.paths).some((animData: AnimatedData) => {
                if (animData.startFrame === animData.endFrame) {
                    return false;
                }
                if (animData.startFrame <= frame && frame <= animData.endFrame) {
                    if (!animData.fromPath) {
                        return false;
                    }
                    const animatePath = ShapeElement.createAnimatePath(animData, frame);
                    this.drawPath(animatePath);
                    if (index !== 0) {
                        this.endHole();
                    }
                    return true;
                }
                return false;
            });
            const lastPath = paths[paths.length - 2];
            if (lastPath.endFrame <= frame) {
                this.drawPath(<PathForShape>lastPath.toPath);
                if (index !== 0) {
                    this.endHole();
                }
            }
        } else if (this.inFrame <= frame && frame <= this.outFrame) {
            this.isClosed = shapePath.isClosed;
            this.drawPath(shapePath.path);
            if (index !== 0) {
                this.endHole();
            }
        }
        return undefined;
    }

    drawShapePaths(frame: number): void {
        this.shapePaths.forEach((shapePath, index) => {
            this.drawShapePath(frame, shapePath, index);
        });
    }

    drawThis(frame: number): void {
        this.clear();

        this.setupStrokeColor(frame);
        this.setupFillColor(frame);

        if (this.trim) {
            this.drawTrim(frame);
        } else if (this.shapePaths) {
            this.drawShapePaths(frame);
        }

        if (this.ellipses) {
            this.beforeDraw();
            this.ellipses.forEach((ellipse: EllipseForShape) => {
                if (ellipse.enabledAnimation) {
                    this.drawEllipseAnimation(frame, ellipse);
                } else {
                    this.drawEllipse(
                        (<Point>ellipse.position).x,
                        (<Point>ellipse.position).y,
                        (<Point>ellipse.size).x / 2.0,
                        (<Point>ellipse.size).y / 2.0
                    );
                }
            });
            this.afterDraw();
        }
        if (this.rects) {
            this.beforeDraw();
            this.rects.forEach((rect: RectangleForShape) => {
                if (rect.enabledAnimation) {
                    this.drawRectAnimation(frame, rect);
                } else {
                    this.drawRect(
                        (<Point>rect.position).x,
                        (<Point>rect.position).y,
                        (<Point>rect.size).x,
                        (<Point>rect.size).y
                    );
                }
            });
            this.afterDraw();
        }
    }

    privateUpdateWithFrame(frame: number): boolean {
        const result = super.privateUpdateWithFrame(frame);
        this.drawThis(frame);
        return result;
    }
}

export interface ShapeBounds {
    top: number;
    bottom: number;
    left: number;
    right: number;
}

export class ShapeContainerElement extends Element {
    shapes: ShapeElement[];
    bounds: ShapeBounds;
    noreplay: boolean;

    constructor(data: ElementData) {
        super(data);
        if (data.bounds) {
            this.setupBounds(data.bounds);
        } else {
            this.width = 0;
            this.height = 0;
        }
        this.shapes = data.shapes!.map((shape: GroupItem | GroupElement) => {
            return new ShapeElement(shape, this.inFrame, this.outFrame, this.startTime);
        });
        this.shapes.forEach((shape: ShapeElement) => {
            if (this.scaleX && this.scaleY) {
                shape.scaleX = this.scaleX;
                shape.scaleY = this.scaleY;
                shape.scale = new Point(this.scaleX, this.scaleY);
            }
            this.addChild(shape);
        });
    }

    destroy(opt?: { children?: boolean; texture?: boolean; baseTexture?: boolean }): void {
        const children = this.children.concat();
        children.forEach((child: DisplayObject) => {
            if ('geometry' in child) {
                (<Graphics>child).destroy(opt);
            }
            this.removeChild(child);
        });
    }

    set frameRate(value: number) {
        super["frameRate"] = value;
        this.children.forEach((child: DisplayObject) => {
            if ('frameRate' in child) {
                (<Element>child).frameRate = value;
            }
        });
    }

    set opt(value: Element) {
        super["opt"] = value;
        this.children.forEach(child => {
            if ('opt' in child) {
                (<Element>child).opt = value;
            }
        });
    }

    updateAnimationFrameByBaseFrame(animBaseFrame: number) {
        super.updateAnimationFrameByBaseFrame(animBaseFrame);
        this.shapes.forEach((shape: ShapeElement) => {
            shape.inFrame += animBaseFrame;
            shape.outFrame += animBaseFrame;
            shape.updateAnimationFrameByBaseFrame(animBaseFrame);
        });
    }

    setupBounds(data: { t: number; b: number; l: number; r: number }) {
        const bounds: ShapeBounds = {
            top: data.t,
            bottom: data.b,
            left: data.l,
            right: data.r
        };
        this.width = data.r - data.l;
        this.height = data.b - data.t;
        this.bounds = bounds;
    }

    privateUpdateWithFrame(frame: number): boolean {
        super.privateUpdateWithFrame(frame);
        if (this.noreplay) {
            const children = this.children.concat();
            children.forEach((layer: DisplayObject) => {
                if ('outFrame' in layer) {
                    if ((<Element>layer).outFrame < frame) {
                        this.removeChild(layer);
                        (<Element>layer).destroy();
                        return false;
                    }

                    (<Element>layer).privateUpdateWithFrame(frame);
                    return true;
                }
            });
        } else {
            this.children.forEach((layer: DisplayObject) => {
                (<Element>layer).privateUpdateWithFrame(frame);
            });
        }

        return false;
    }
}
