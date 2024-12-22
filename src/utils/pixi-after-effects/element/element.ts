// import 'core-js/modules/es7.object.values';
import { Container, Sprite, Text, Point, Graphics, DisplayObject, BLEND_MODES } from 'pixi.js';
import { bezier as BezierEasing } from '../../bezier/bezier-easing';
import { AfterEffects } from '../after-effects';
import { ElementFinder } from './finder';
import { ElementPlayer } from './player';
import { ElementDeltaPlayer } from './delta_player';
import { MaskElement, MasksProperties } from './mask';
import { PathForShape, GroupElement, GroupItem, ShapeElement } from './shape';

const TRACK_MATTE_TYPE: { ALPHA: number; ALPHA_INVERTED: number; LUMA: number; LUMA_INVERTED: number } = {
    ALPHA: 1,
    ALPHA_INVERTED: 2,
    LUMA: 3,
    LUMA_INVERTED: 4
};

export interface ElementData {
    ao: number;
    w: number;
    h: number;
    nm: string;
    p?: string;
    id?: string;
    refId: string;
    ty: number | string;
    completed: any;
    ind: number;
    parent: number;
    ip: number;
    op: number;
    sr: number;
    st: number;
    hasMask: boolean;
    ks: Transform;
    bm: number;
    bmPIXI: number;
    tt: any;
    td: any;
    masksProperties: any;
    events: { [x: string]: Function };
    bounds: {
        t: number;
        b: number;
        l: number;
        r: number;
    };
    image?: Sprite;
    shapes?: (GroupItem | GroupElement)[];
    sc?: string | number;
    sw?: number;
    sh?: number;
    text?: Text;
    rawText?: string;
    t?: {
        d: {
            k: {
                s: TextPropierties;
            }[];
        };
    };
    imagePath?: string;
    texture?: any;
    isDisused?: boolean;
    layers?: ElementData[];
    u?: string;
}

export interface TextPropierties {
    f: string;
    fc: number[];
    s: number;
    t: string;
    lh: number;
    ls: any;
    tr: any;
    j: number;
}

export interface Transform {
    mn?: string;
    nm?: string;
    ty?: string;
    a: MultiDimensional | MultiDimensionalKeyframed;
    p: MultiDimensional | MultiDimensionalKeyframed;
    s: MultiDimensional | MultiDimensionalKeyframed;
    r: Value | ValueKeyframed;
    o: Value | ValueKeyframed;
    px: Value | ValueKeyframed;
    py: Value | ValueKeyframed;
    pz: Value | ValueKeyframed;
    sk: Value | ValueKeyframed;
    sa: Value | ValueKeyframed;
}

export interface MultiDimensional {
    a: number;
    k: number[];
    x: string | { k: number | number[] | ValueKeyframe[] };
    y: string | { k: number | number[] | ValueKeyframe[] };
    ix: string;
}

export interface OffsetKeyframe {
    n: string[];
    s: number[];
    e: number | number[];
    t: number;
    i: { x: number | number[]; y: number | number[] };
    o: { x: number | number[]; y: number | number[] };
}

export interface MultiDimensionalKeyframed {
    k: OffsetKeyframe[];
    x: string | { k: number | number[] | ValueKeyframe[] };
    y: string | { k: number | number[] | ValueKeyframe[] };
    ix: string;
    ti: number[];
    to: number[];
}

export interface ValueKeyframed {
    a: number;
    k: ValueKeyframe[] | number;
    x: string;
    ix: string;
}

export interface ValueKeyframe {
    n: string[];
    s: number | number[];
    e: number | number[];
    t: number;
    i: { x: number | number[]; y: number | number[] };
    o: { x: number | number[]; y: number | number[] };
}

export interface Value {
    a: number;
    k: number;
    x: string;
    ix: string;
}

export interface AnimatedData {
    name: string[];
    startFrame: number;
    endFrame: number;
    easing: (x: number) => number;
    fromPosition?: number | number[] | undefined;
    toPosition?: number | number[] | undefined;
    toPos?: Point | undefined;
    fromAnchorPoint?: number | number[] | undefined;
    toAnchorPoint?: number | number[] | undefined;
    fromOpacity?: number | number[] | undefined;
    toOpacity?: number | number[] | undefined;
    fromRotation?: number | number[] | undefined;
    toRotation?: number | number[] | undefined;
    fromScale?: number | number[] | undefined;
    toScale?: number | number[] | undefined;
    fromPath?: PathForShape | null;
    toPath?: PathForShape | null;
    fromRatio?: number | null;
    toRatio?: number | null;
    fromColor?: string;
    toColor?: string;
}

export interface AnimationPoint {
    x: AnimatedData[];
    y: AnimatedData[];
}

export class Element extends Graphics {
    maskLayer: MaskElement;
    finder: ElementFinder;
    referenceId: string;
    type: string | number;
    isCompleted: boolean;
    index: number;
    hasParent: DisplayObject;
    parentIndex: number;
    inFrame: number;
    outFrame: number;
    stretch: number;
    startTime: number;
    hasMask: boolean;
    hasTrackMatteType: boolean;
    trackMatteType: any;
    isTrackMatteData: boolean;
    player: ElementPlayer;
    deltaPlayer: ElementDeltaPlayer;
    masksProperties: MasksProperties[];
    isInvertedMask: boolean;
    interactiveEventMap: { [key: string]: boolean };
    hasAnimatedAnchorPoint: boolean;
    animatedAnchorPoints: AnimatedData[];
    hasAnimatedOpacity: boolean;
    animatedOpacities: AnimatedData[];
    hasAnimatedPosition: boolean;
    animatedPositions: AnimatedData[] | AnimationPoint;
    hasAnimatedSeparatedPosition: boolean;
    hasAnimatedRotation: boolean;
    animatedRotations: AnimatedData[];
    hasAnimatedScale: boolean;
    animatedScales: AnimatedData[];
    scaleX: any;
    scaleY: any;
    shapes: ShapeElement[];
    [key: string]: any;

    constructor(data?: ElementData) {
        super();
        this.finder = new ElementFinder();
        if (!data) {
            return;
        }
        this.name = data.nm;
        this.referenceId = data.refId;
        this.type = <number>data.ty;
        this.isCompleted = data.completed;
        this.index = data.ind;
        // this.hasParent = Object.prototype.hasOwnProperty.call(data, 'parent');
        this.hasParent = (<any> data)['parent'];
        this.parentIndex = data.parent;
        this.inFrame = data.ip;
        this.outFrame = data.op;
        this.stretch = data.sr || 1;
        this.startTime = data.st;
        this.hasMask = data.hasMask;
        this.setupProperties(data.ks);
        this.blendMode = Element.toPIXIBlendMode(data.bm);
        if (data.bmPIXI) {
            this.blendMode = data.bmPIXI;
        }
        if (data.tt) {
            this.hasTrackMatteType = true;
            this.trackMatteType = data.tt;
        } else if (data.td) {
            this.isTrackMatteData = true;
        }
        this.player = new ElementPlayer(
            0,
            0,
            this.outFrame,
            (frame: number) => {
                this.updateWithFrameBySelfPlayer(frame);
            },
            () => {
                this.emit('completed', this);
            }
        );
        this.deltaPlayer = new ElementDeltaPlayer(
            0,
            0,
            this.outFrame,
            (frame: number) => {
                this.updateWithFrameBySelfPlayer(frame);
            },
            () => {
                this.emit('completed', this);
            }
        );
        if (data.masksProperties) {
            this.masksProperties = data.masksProperties;
        }
        if (data.events) {
            // Object.keys(data.events).forEach((eventName: string) => {
            for (const eventName in data.events) {
                if (this.isInteractiveEvent(eventName)) {
                    this.interactive = true;
                }
                this.on(eventName, data.events[eventName]);
            }
            // });
        }
    }

    static toPIXIBlendMode(mode: number): BLEND_MODES {
        switch (mode) {
            case 0:
                return BLEND_MODES.NORMAL;
            case 1:
                return BLEND_MODES.MULTIPLY;
            case 2:
                return BLEND_MODES.SCREEN;
            case 3:
                return BLEND_MODES.OVERLAY;
            case 4:
                return BLEND_MODES.DARKEN;
            case 5:
                return BLEND_MODES.LIGHTEN;
            case 6:
                return BLEND_MODES.COLOR_DODGE;
            case 7:
                return BLEND_MODES.COLOR_BURN;
            case 8:
                return BLEND_MODES.HARD_LIGHT;
            case 9:
                return BLEND_MODES.SOFT_LIGHT;
            case 10:
                return BLEND_MODES.DIFFERENCE;
            case 11:
                return BLEND_MODES.EXCLUSION;
            case 12:
                return BLEND_MODES.HUE;
            case 13:
                return BLEND_MODES.SATURATION;
            case 14:
                return BLEND_MODES.COLOR;
            case 15:
                return BLEND_MODES.LUMINOSITY;
            default:
                break;
        }
        return BLEND_MODES.NORMAL;
    }

    static createAnchorPoint(data: MultiDimensional | MultiDimensionalKeyframed): Point | AnimatedData[] {
        if (typeof data.k[0] === 'number') {
            return new Point(<number>data.k[0], <number>data.k[1]);
        }
        return Element.createAnimatedAnchorPoint(data.k);
    }

    static createAnchorPointEasing(animData: OffsetKeyframe): ((x: number) => number) {
        if (animData.i && animData.o) {
            return BezierEasing(<number>animData.o.x, <number>animData.o.y, <number>animData.i.x, <number>animData.i.y);
        }
        return (x: number) => x;
    }

    static createAnimatedAnchorPoint(data: (number | OffsetKeyframe)[]): AnimatedData[] {
        const lastIndex = data.length - 1;
        return data.map((animData: number | OffsetKeyframe, index: number) => {
            return {
                name: (<OffsetKeyframe>animData).n,
                startFrame: (<OffsetKeyframe>animData).t,
                endFrame: lastIndex > index ? (<OffsetKeyframe>data[index + 1]).t : (<OffsetKeyframe>animData).t,
                easing: Element.createAnchorPointEasing(<OffsetKeyframe>animData),
                fromAnchorPoint: (<OffsetKeyframe>animData).s,
                toAnchorPoint: (<OffsetKeyframe>animData).e
            };
        });
    }

    static createOpacity(data: Value | ValueKeyframed): number | AnimatedData[] {
        if (typeof data.k === 'number') {
            return data.k / 100.0;
        }
        return Element.createAnimatedOpacity(data.k);
    }

    static createOpacityEasing(animData: ValueKeyframe): ((x: number) => number) {
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

    static createAnimatedOpacity(data: ValueKeyframe[]): AnimatedData[] {
        const lastIndex = data.length - 1;
        return data.map((animData: ValueKeyframe, index: number) => {
            let fromOpacity;
            let toOpacity;
            if (animData.s && animData.e) {
                fromOpacity = (<number[]>animData.s)[0];
                toOpacity = (<number[]>animData.e)[0];
            } else if (animData.s && !animData.e) {
                fromOpacity = (<number[]>animData.s)[0];
                toOpacity = fromOpacity;
            }
            return {
                name: animData.n,
                startFrame: animData.t,
                endFrame: lastIndex > index ? data[index + 1].t : animData.t,
                easing: Element.createOpacityEasing(animData),
                fromOpacity: fromOpacity !== undefined ? fromOpacity / 100.0 : undefined,
                toOpacity: toOpacity !== undefined ? toOpacity / 100.0 : undefined
            };
        });
    }

    static createPosition(data: MultiDimensional | MultiDimensionalKeyframed): Point | AnimationPoint | AnimatedData[] {
        if (!data.k && data.x && data.y) {
            const multidimensionX = data.x;
            // if (typeof data.x.k === 'number') {
            if (
                !(typeof data.x === 'string') &&
                !(typeof data.y === 'string') &&
                typeof data.x.k === 'number' &&
                typeof data.y.k === 'number'
            ) {
                return new Point(data.x.k, data.y.k);
            }
            if (typeof data.x === 'string' || typeof data.y === 'string') {
                return new Point(+data.x, +data.y);
            }
            return {
                x: Element.createAnimatedSeparatedPosition(<ValueKeyframe[]>data.x.k),
                y: Element.createAnimatedSeparatedPosition(<ValueKeyframe[]>data.y.k)
            };
        }
        const pos = data.k;
        if (pos instanceof Array && typeof pos[0] === 'number') {
            return new Point((<number[]>pos)[0], (<number[]>pos)[1]);
        }
        return Element.createAnimatedPosition(<ValueKeyframe[]>data.k);
    }

    static createSeparatedPositionEasing(animData: ValueKeyframe): ((x: number) => number) {
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

    static createAnimatedSeparatedPosition(data: ValueKeyframe[]): AnimatedData[] {
        const lastIndex = data.length - 1;
        return data.map((animData: ValueKeyframe, index) => {
            return {
                name: animData.n,
                startFrame: animData.t,
                endFrame: lastIndex > index ? data[index + 1].t : animData.t,
                easing: Element.createSeparatedPositionEasing(animData),
                fromPosition: animData.s ? (<number[]>animData.s)[0] : undefined,
                toPosition: animData.e ? (<number[]>animData.e)[0] : undefined
            };
        });
    }

    static createPositionEasing(animData: ValueKeyframe): ((x: number) => number) {
        if (!animData.i || !animData.o) {
            return (x: number) => x;
        }
        if (
            typeof animData.i.x === 'number' &&
            typeof animData.o.x === 'number' &&
            typeof animData.i.y === 'number' &&
            typeof animData.o.y === 'number'
        ) {
            return BezierEasing(animData.o.x, animData.o.y, animData.i.x, animData.i.y);
        }
        return BezierEasing(
            (<number[]>animData.o.x)[0],
            (<number[]>animData.o.y)[0],
            (<number[]>animData.i.x)[0],
            (<number[]>animData.i.y)[0]
        );
    }

    static createAnimatedPosition(data: ValueKeyframe[]): AnimatedData[] {
        const lastIndex = data.length - 1;
        return data.map((animData, index) => {
            return {
                name: animData.n,
                startFrame: animData.t,
                endFrame: lastIndex > index ? data[index + 1].t : animData.t,
                easing: Element.createPositionEasing(animData),
                fromPosition: animData.s,
                toPosition: animData.e ? animData.e : animData.s
            };
        });
    }

    static createRotation(data: Value | ValueKeyframed): number | AnimatedData[] {
        const rotation = data.k;
        if (typeof rotation === 'number') {
            return (Math.PI * rotation) / 180.0;
        }
        return Element.createAnimatedRotation(<ValueKeyframe[]>data.k);
    }

    static createRotationEasing(animData: ValueKeyframe): ((x: number) => number) {
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

    static createAnimatedRotation(data: ValueKeyframe[]): AnimatedData[] {
        const lastIndex = data.length - 1;
        return data.map((animData: ValueKeyframe, index: number) => {
            return {
                name: animData.n,
                startFrame: animData.t,
                endFrame: lastIndex > index ? data[index + 1].t : animData.t,
                easing: Element.createRotationEasing(animData),
                fromRotation: animData.s ? (Math.PI * (<number[]>animData.s)[0]) / 180.0 : undefined,
                toRotation: animData.e ? (Math.PI * (<number[]>animData.e)[0]) / 180.0 : undefined
            };
        });
    }

    static createScale(data: MultiDimensional | MultiDimensionalKeyframed): Point | AnimatedData[] {
        const scale = data.k;
        if (typeof scale[0] === 'number') {
            const scaleX = <number>scale[0] / 100.0;
            const scaleY = <number>scale[1] / 100.0;
            return new Point(scaleX, scaleY);
        }
        return Element.createAnimatedScale(<OffsetKeyframe[]>data.k);
    }

    static createScaleEasing(animData: OffsetKeyframe): ((x: number) => number) {
        if (animData.i && animData.o) {
            return BezierEasing(
                (<number[]>animData.o.x)[0],
                (<number[]>animData.o.y)[1],
                (<number[]>animData.i.x)[0],
                (<number[]>animData.i.y)[1]
            );
        }
        return x => x;
    }

    static createAnimatedScale(data: OffsetKeyframe[]): AnimatedData[] {
        const lastIndex = data.length - 1;
        return data.map((animData: OffsetKeyframe, index: number) => {
            return {
                name: animData.n,
                startFrame: animData.t,
                endFrame: lastIndex > index ? data[index + 1].t : animData.t,
                easing: Element.createScaleEasing(animData),
                fromScale: animData.s,
                toScale: animData.e ? animData.e : animData.s
            };
        });
    }

    privateRoot(node: Container): Container | null {
        if (node instanceof AfterEffects) {
            return node;
        }
        if (node.parent) {
            return this.privateRoot(node.parent);
        }
        return null;
    }

    root(): Container | null {
        return this.privateRoot(<Container>(<unknown>this));
    }

    addChild(...child: DisplayObject[]): DisplayObject {
        const result: DisplayObject = super.addChild(...child);
        child.forEach(childElement => {
            if ('isInvertedMask' in childElement && this.isInvertedMask) {
                (<Element>childElement).isInvertedMask = true;
            }
        });
        return result;
    }

    isInvertTrackMatteType(): boolean {
        return this.trackMatteType === TRACK_MATTE_TYPE.ALPHA_INVERTED || this.trackMatteType === TRACK_MATTE_TYPE.LUMA_INVERTED;
    }

    public set frameRate(value: number) {
        if (this.player) {
            this.player.frameRate = value;
        }
        if (this.deltaPlayer) {
            this.deltaPlayer.frameRate = value;
        }
    }

    public set opt(value: Element) {
        // Object.keys(value).forEach(key => {
        for (const key in value) {
            this[key] = value[key];
        }
        // });
    }

    isInteractiveEvent(eventName: string): boolean {
        if (!this.interactiveEventMap) {
            const interactiveEvents = [
                'click',
                'mousedown',
                'mousemove',
                'mouseout',
                'mouseover',
                'mouseup',
                'mouseupoutside',
                'pointercancel',
                'pointerdown',
                'pointermove',
                'pointerout',
                'pointerover',
                'pointertap',
                'pointerup',
                'pointerupoutside',
                'removed',
                'rightclick',
                'rightdown',
                'rightup',
                'rightupoutside',
                'tap',
                'touchcancel',
                'touchend',
                'touchendoutside',
                'touchmove',
                'touchstart'
            ];
            this.interactiveEventMap = {};
            interactiveEvents.forEach((event: string) => {
                this.interactiveEventMap[event] = true;
            });
        }
        return this.interactiveEventMap[eventName];
    }

    find(name: string): Container[] {
        return this.finder.findByName(name, this);
    }

    isCompType(): boolean {
        return this.type === 0;
    }

    isImageType(): boolean {
        return this.type === 2;
    }

    setupProperties(data: Transform) {
        if (!data) {
            return;
        }

        this.setupPosition(data.p);
        this.setupAnchorPoint(data.a);
        this.setupOpacity(data.o);
        this.setupRotation(data.r);
        this.setupScale(data.s);
    }

    updateAnimationFrameByBaseFrame(animBaseFrame: number) {
        if (this.hasAnimatedAnchorPoint) {
            this.animatedAnchorPoints.forEach((animData: AnimatedData) => {
                animData.startFrame += animBaseFrame;
                animData.endFrame += animBaseFrame;
            });
        }
        if (this.hasAnimatedOpacity) {
            this.animatedOpacities.forEach((animData: AnimatedData) => {
                animData.startFrame += animBaseFrame;
                animData.endFrame += animBaseFrame;
            });
        }
        if (this.hasAnimatedPosition) {
            (<AnimatedData[]>this.animatedPositions).forEach((animData: AnimatedData) => {
                animData.startFrame += animBaseFrame;
                animData.endFrame += animBaseFrame;
            });
        }
        if (this.hasAnimatedSeparatedPosition) {
            (<AnimationPoint>this.animatedPositions).x.forEach((animData: AnimatedData) => {
                animData.startFrame += animBaseFrame;
                animData.endFrame += animBaseFrame;
            });
            (<AnimationPoint>this.animatedPositions).y.forEach((animData: AnimatedData) => {
                animData.startFrame += animBaseFrame;
                animData.endFrame += animBaseFrame;
            });
        }
        if (this.hasAnimatedRotation) {
            this.animatedRotations.forEach((animData: AnimatedData) => {
                animData.startFrame += animBaseFrame;
                animData.endFrame += animBaseFrame;
            });
        }
        if (this.hasAnimatedScale) {
            this.animatedScales.forEach((animData: AnimatedData) => {
                animData.startFrame += animBaseFrame;
                animData.endFrame += animBaseFrame;
            });
        }
    }

    setupAnchorPoint(data: MultiDimensional | MultiDimensionalKeyframed): void {
        const anchorPoint = Element.createAnchorPoint(data);
        if (!('x' in anchorPoint) && anchorPoint.length > 0) {
            this.hasAnimatedAnchorPoint = true;
            this.animatedAnchorPoints = anchorPoint;
        } else {
            this.pivot = <Point>anchorPoint;
        }
    }

    setupOpacity(data: Value | ValueKeyframed): void {
        const opacity = Element.createOpacity(data);
        if (!(typeof opacity === 'number') && opacity.length > 0) {
            this.hasAnimatedOpacity = true;
            this.animatedOpacities = opacity;
        } else if (typeof opacity === 'number') {
            this.alpha = opacity;
        }
    }

    setupPosition(data: MultiDimensional | MultiDimensionalKeyframed): void {
        const pos = Element.createPosition(data);
        // if (pos.x && pos.y && pos.x.length > 0 && pos.y.length > 0) {
        //   this.hasAnimatedSeparatedPosition = true;
        //   this.animatedPositions = pos;
        // } else if (pos.length > 0) {
        //   this.hasAnimatedPosition = true;
        //   this.animatedPositions   = pos;
        // } else {
        //   this.position = pos;
        // }
        if (
            'x' in pos &&
            pos.x &&
            pos.y &&
            typeof pos.x !== 'number' &&
            typeof pos.y !== 'number' &&
            pos.x.length > 0 &&
            pos.y.length > 0
        ) {
            this.hasAnimatedSeparatedPosition = true;
            this.animatedPositions = <AnimationPoint>pos;
        } else if ('x' in pos) {
            this.position = <Point>pos;
        } else if (pos.length > 0) {
            this.hasAnimatedPosition = true;
            this.animatedPositions = pos;
        }
    }

    setupRotation(data: Value | ValueKeyframed): void {
        if (!data) {
            return; // not 'r' property at z rotation pattern
        }

        const rotation = Element.createRotation(data);
        if (typeof rotation !== 'number' && rotation.length > 0) {
            this.hasAnimatedRotation = true;
            this.animatedRotations = rotation;
        } else if (typeof rotation === 'number') {
            this.rotation = rotation;
        }
    }

    setupScale(data: MultiDimensional | MultiDimensionalKeyframed): void {
        const scale = Element.createScale(data);
        if (!('x' in scale) && scale.length > 0) {
            this.hasAnimatedScale = true;
            this.animatedScales = scale;
        } else if ('x' in scale) {
            this.scaleX = scale.x;
            this.scaleY = scale.y;
            this.scale = scale;
        }
    }

    animateAnchorPoint(frame: number): boolean {
        let isAnimated = false;
        if (frame < this.animatedAnchorPoints[0].startFrame) {
            const anchorPoint = this.animatedAnchorPoints[0].fromAnchorPoint;
            this.pivot = new Point((<number[]>anchorPoint)[0], (<number[]>anchorPoint)[1]);
        }
        this.animatedAnchorPoints.some((animData: AnimatedData) => {
            if (animData.startFrame === animData.endFrame) {
                return false;
            }
            if (animData.startFrame <= frame && frame <= animData.endFrame) {
                if (animData.fromAnchorPoint === undefined) {
                    return false;
                }
                const anchorPointDiffX = (<number[]>animData.toAnchorPoint)[0] - (<number[]>animData.fromAnchorPoint)[0];
                const anchorPointDiffY = (<number[]>animData.toAnchorPoint)[1] - (<number[]>animData.fromAnchorPoint)[1];
                const totalFrame = animData.endFrame - animData.startFrame;
                const playFrame = (frame - animData.startFrame) * 1.0;
                const playRatio = playFrame / totalFrame;
                const posRatio = animData.easing(playRatio);
                const anchorPointX = posRatio * anchorPointDiffX + (<number[]>animData.fromAnchorPoint)[0];
                const anchorPointY = posRatio * anchorPointDiffY + (<number[]>animData.fromAnchorPoint)[1];
                this.pivot = new Point(anchorPointX, anchorPointY);
                isAnimated = true;
                return true;
            }
            return false;
        });
        if (!isAnimated && frame > this.animatedAnchorPoints[this.animatedAnchorPoints.length - 1].endFrame) {
            const anchorPoint = this.animatedAnchorPoints[this.animatedAnchorPoints.length - 2].toAnchorPoint;
            this.pivot = new Point((<number[]>anchorPoint)[0], (<number[]>anchorPoint)[1]);
        }
        return isAnimated;
    }

    animateOpacity(frame: number): boolean {
        let isAnimated = false;
        if (frame < this.animatedOpacities[0].startFrame) {
            const opacity = this.animatedOpacities[0].fromOpacity;
            this.alpha = <number>opacity;
        }
        this.animatedOpacities.some(animData => {
            if (animData.startFrame === animData.endFrame) {
                return false;
            }
            if (animData.startFrame <= frame && frame <= animData.endFrame) {
                if (animData.fromOpacity === undefined) {
                    return false;
                }
                const opacityDiff = <number>animData.toOpacity - <number>animData.fromOpacity;
                const totalFrame = animData.endFrame - animData.startFrame;
                const playFrame = (frame - animData.startFrame) * 1.0;
                const playRatio = playFrame / totalFrame;
                const opacityRatio = animData.easing(playRatio);
                const opacity = opacityDiff * opacityRatio + <number>animData.fromOpacity;
                this.alpha = opacity;
                isAnimated = true;
                return true;
            }
            return false;
        });
        if (!isAnimated && frame > this.animatedOpacities[this.animatedOpacities.length - 1].endFrame) {
            const opacity = this.animatedOpacities[this.animatedOpacities.length - 2].toOpacity;
            this.alpha = <number>opacity;
        }
        return isAnimated;
    }

    animatePosition(frame: number): boolean {
        let isAnimated = false;
        const animatedPositions = <AnimatedData[]>this.animatedPositions;
        if (frame < animatedPositions[0].startFrame) {
            const position = animatedPositions[0].fromPosition;
            this.position = new Point((<number[]>position)[0], (<number[]>position)[1]);
        }
        animatedPositions.some(animData => {
            if (animData.startFrame === animData.endFrame) {
                return false;
            }
            if (animData.startFrame <= frame && frame <= animData.endFrame) {
                if (animData.fromPosition === undefined) {
                    return false;
                }
                const posDiffX = (<number[]>animData.toPosition)[0] - (<number[]>animData.fromPosition)[0];
                const posDiffY = (<number[]>animData.toPosition)[1] - (<number[]>animData.fromPosition)[1];
                const totalFrame = animData.endFrame - animData.startFrame;
                const playFrame = (frame - animData.startFrame) * 1.0;
                const playRatio = playFrame / totalFrame;
                const posRatio = animData.easing(playRatio);
                const posX = posDiffX * posRatio;
                const posY = posDiffY * posRatio;
                this.x = (<number[]>animData.fromPosition)[0] + posX;
                this.y = (<number[]>animData.fromPosition)[1] + posY;
                isAnimated = true;
                return true;
            }
            return false;
        });
        if (!isAnimated && frame > animatedPositions[animatedPositions.length - 1].endFrame) {
            const position = animatedPositions[animatedPositions.length - 2].toPosition;
            this.position = new Point((<number[]>position)[0], (<number[]>position)[1]);
        }
        return isAnimated;
    }

    animateSeparatedPosition(frame: number): boolean {
        const animatedPositions = <AnimationPoint>this.animatedPositions;
        const animatedPositionX = animatedPositions.x;
        const animatedPositionY = animatedPositions.y;
        if (frame < animatedPositionX[0].startFrame) {
            this.x = <number>animatedPositionX[0].fromPosition;
        }
        if (frame < animatedPositionY[0].startFrame) {
            this.y = <number>animatedPositionY[0].fromPosition;
        }
        animatedPositionX.some((animData: AnimatedData) => {
            if (animData.startFrame === animData.endFrame) {
                return false;
            }
            if (animData.startFrame <= frame && frame <= animData.endFrame) {
                if (animData.fromPosition === undefined) {
                    return false;
                }
                const posDiff = <number>animData.toPosition - <number>animData.fromPosition;
                const totalFrame = animData.endFrame - animData.startFrame;
                const playFrame = (frame - animData.startFrame) * 1.0;
                const playRatio = playFrame / totalFrame;
                const posRatio = animData.easing(playRatio);
                this.x = posDiff * posRatio + <number>animData.fromPosition;
                return true;
            }
            return false;
        });
        animatedPositionY.some((animData: AnimatedData) => {
            if (animData.startFrame === animData.endFrame) {
                return false;
            }
            if (animData.startFrame <= frame && frame <= animData.endFrame) {
                if (animData.fromPosition === undefined) {
                    return false;
                }
                const posDiff = <number>animData.toPosition - <number>animData.fromPosition;
                const totalFrame = animData.endFrame - animData.startFrame;
                const playFrame = (frame - animData.startFrame) * 1.0;
                const playRatio = playFrame / totalFrame;
                const posRatio = animData.easing(playRatio);
                this.y = posDiff * posRatio + <number>animData.fromPosition;
                return true;
            }
            return false;
        });
        if (frame > animatedPositionX[animatedPositionX.length - 1].endFrame) {
            const x = <number>animatedPositionX[animatedPositionX.length - 2].toPosition;
            const y = <number>animatedPositionY[animatedPositionY.length - 2].toPosition;
            this.position = new Point(x, y);
        }
        return false;
    }

    animateRotation(frame: number): boolean {
        let isAnimated = false;
        if (frame < this.animatedRotations[0].startFrame) {
            const rotation = this.animatedRotations[0].fromRotation;
            this.rotation = <number>rotation;
        }
        this.animatedRotations.some((animData: AnimatedData) => {
            if (animData.startFrame === animData.endFrame) {
                return false;
            }
            if (animData.startFrame <= frame && frame <= animData.endFrame) {
                if (animData.fromRotation === undefined) {
                    return false;
                }
                const rotDiff = <number>animData.toRotation - <number>animData.fromRotation;
                const totalFrame = animData.endFrame - animData.startFrame;
                const playFrame = (frame - animData.startFrame) * 1.0;
                const playRatio = playFrame / totalFrame;
                const rotRatio = animData.easing(playRatio);
                this.rotation = rotDiff * rotRatio + <number>animData.fromRotation;
                isAnimated = true;
                return true;
            }
            return false;
        });
        if (!isAnimated && frame > this.animatedRotations[this.animatedRotations.length - 1].endFrame) {
            const rotation = this.animatedRotations[this.animatedRotations.length - 2].toRotation;
            this.rotation = <number>rotation;
        }
        return isAnimated;
    }

    animateScale(frame: number): boolean {
        let isAnimated = false;
        if (frame < this.animatedScales[0].startFrame) {
            const scale = this.animatedScales[0].fromScale;
            this.scale = new Point((<number[]>scale)[0] / 100.0, (<number[]>scale)[1] / 100.0);
        }
        this.animatedScales.some(animData => {
            if (animData.startFrame === animData.endFrame) {
                return false;
            }
            if (animData.startFrame <= frame && frame <= animData.endFrame) {
                if (animData.fromScale === undefined) {
                    return false;
                }
                const scaleDiffX = (<number[]>animData.toScale)[0] - (<number[]>animData.fromScale)[0];
                const scaleDiffY = (<number[]>animData.toScale)[1] - (<number[]>animData.fromScale)[1];
                const totalFrame = animData.endFrame - animData.startFrame;
                const playFrame = (frame - animData.startFrame) * 1.0;
                const playRatio = playFrame / totalFrame;
                const scaleRatio = animData.easing(playRatio);
                const scaleX = scaleDiffX * scaleRatio + (<number[]>animData.fromScale)[0];
                const scaleY = scaleDiffY * scaleRatio + (<number[]>animData.fromScale)[1];
                this.scaleX = scaleX / 100.0;
                this.scaleY = scaleY / 100.0;
                this.scale = new Point(this.scaleX, this.scaleY);
                isAnimated = true;
                return true;
            }
            return false;
        });
        if (!isAnimated && frame > this.animatedScales[this.animatedScales.length - 1].endFrame) {
            const scale = this.animatedScales[this.animatedScales.length - 2].toScale;
            this.scale = new Point((<number[]>scale)[0] / 100.0, (<number[]>scale)[1] / 100.0);
        }
        return isAnimated;
    }

    hasAnimateProperty(): boolean {
        return (
            this.hasAnimatedAnchorPoint ||
            this.hasAnimatedOpacity ||
            this.hasAnimatedPosition ||
            this.hasAnimatedRotation ||
            this.hasAnimatedScale ||
            this.hasAnimatedSeparatedPosition
        );
    }

    update(nowTime: number): void {
        if (!this.player) {
            return;
        }
        this.player.update(nowTime);
    }

    updateByDelta(deltaTime: number): void {
        if (!this.deltaPlayer) {
            return;
        }
        this.deltaPlayer.update(deltaTime);
    }

    // called from self player
    updateWithFrameBySelfPlayer(frame: number): void {
        this.privateUpdateWithFrame(frame);
    }

    // called from parent layer. if self player is playing, stop it.
    updateWithFrame(frame: number): void {
        if (this.player && this.player.isPlaying) {
            this.player.stop();
        }
        if (this.deltaPlayer && this.deltaPlayer.isPlaying) {
            this.deltaPlayer.stop();
        }
        this.privateUpdateWithFrame(frame);
    }

    privateUpdateWithFrame(frame: number): boolean {
        if (this.inFrame <= frame && frame <= this.outFrame) {
            this.visible = true;
        } else {
            this.visible = false;
        }
        if (!this.visible || !this.hasAnimateProperty()) {
            return true;
        }

        if (this.hasAnimatedAnchorPoint) {
            this.animateAnchorPoint(frame);
        }
        if (this.hasAnimatedOpacity) {
            this.animateOpacity(frame);
        }
        if (this.hasAnimatedPosition) {
            this.animatePosition(frame);
        }
        if (this.hasAnimatedRotation) {
            this.animateRotation(frame);
        }
        if (this.hasAnimatedScale) {
            this.animateScale(frame);
        }
        if (this.hasAnimatedSeparatedPosition) {
            this.animateSeparatedPosition(frame);
        }
        return true;
    }

    play(isLoop: boolean): void {
        if (this.player) {
            this.player.play(isLoop);
        }
        if (this.deltaPlayer) {
            this.deltaPlayer.play(isLoop);
        }
    }

    pause(): void {
        if (this.player) {
            this.player.pause();
        }
        if (this.deltaPlayer) {
            this.deltaPlayer.pause();
        }
    }

    resume(): void {
        if (this.player) {
            this.player.resume();
        }
        if (this.deltaPlayer) {
            this.deltaPlayer.resume();
        }
    }

    stop(): void {
        if (this.player) {
            this.player.stop();
        }
        if (this.deltaPlayer) {
            this.deltaPlayer.stop();
        }
    }
}
