import { BLEND_MODES } from 'pixi.js';
import { ShapeElement, ShapeProp, PropsShapeKeyframed, PathForShape } from './shape';
import { Element, Value, ValueKeyframed, AnimatedData } from './element';

const MASK_MODE = {
    NONE: 0,
    ADDITIVE: 1,
    SUBTRACT: 2,
    LIGHTEN: 3,
    DARKEN: 4,
    DIFFERENCE: 5
};

export interface MasksProperties {
    cl: boolean;
    inv: boolean;
    pt: {
        k: ShapeProp | PropsShapeKeyframed[];
    };
    mode: string;
    o: Value | ValueKeyframed;
}

export class MaskElement extends ShapeElement {
    maskShapePaths: PathForShape[];
    isMaskLayer: boolean;
    maskTargetLayer: Element;
    maskMode: number;
    screenWidth: number;
    screenHeight: number;

    constructor(maskTargetLayer: Element) {
        super();
        this.maskShapePaths = maskTargetLayer.masksProperties.map((maskProperty: MasksProperties) => {
            return this.createPath(maskProperty.pt.k);
        });
        const data = maskTargetLayer.masksProperties[0];
        this.isMaskLayer = true;
        this.maskTargetLayer = maskTargetLayer;
        this.isClosed = data.cl;
        this.isInvertedMask = data.inv;
        this.maskMode = MaskElement.toMaskMode(data.mode);
        this.setBlendModeByMaskMode(this.maskMode);
        this.inFrame = maskTargetLayer.inFrame;
        this.outFrame = maskTargetLayer.outFrame;
        this.setupOpacity(data.o);
        this.fillColorHex = '0x000000';
        this.fillRGBA = { enabled: true };
    }

    static toMaskMode(mode: string): number {
        let maskMode = MASK_MODE.ADDITIVE;
        switch (mode) {
            case 'n':
                maskMode = MASK_MODE.NONE;
                break;
            case 'a':
                maskMode = MASK_MODE.ADDITIVE;
                break;
            case 's':
                maskMode = MASK_MODE.SUBTRACT;
                break;
            case 'l':
                maskMode = MASK_MODE.LIGHTEN;
                break;
            case 'd':
                maskMode = MASK_MODE.DARKEN;
                break;
            case 'f':
                maskMode = MASK_MODE.DIFFERENCE;
                break;
            default:
                break;
        }
        return maskMode;
    }

    setBlendModeByMaskMode(mode: number): void {
        switch (mode) {
            case MASK_MODE.ADDITIVE:
                this.blendMode = BLEND_MODES.ADD;
                break;
            case MASK_MODE.SUBTRACT:
                // no match into BLEND_MODES
                break;
            case MASK_MODE.LIGHTEN:
                this.blendMode = BLEND_MODES.LIGHTEN;
                break;
            case MASK_MODE.DARKEN:
                this.blendMode = BLEND_MODES.DARKEN;
                break;
            case MASK_MODE.DIFFERENCE:
                this.blendMode = BLEND_MODES.DIFFERENCE;
                break;
            default:
                break;
        }
    }

    updateAnimationFrameByBaseFrame(animBaseFrame: number): void {
        super.updateAnimationFrameByBaseFrame(animBaseFrame);
        if (!this.maskShapePaths) {
            return;
        }
        this.maskShapePaths.forEach((shapePath: PathForShape) => {
            if (!shapePath.hasAnimatedPath) {
                return;
            }
            (<AnimatedData[]>shapePath.paths).forEach((animData: AnimatedData) => {
                animData.startFrame += animBaseFrame;
                animData.endFrame += animBaseFrame;
            });
        });
    }

    drawMask(frame: number, shapePath: PathForShape): boolean {
        let drawnMask = false;
        if (shapePath.hasAnimatedPath) {
            this.isClosed = shapePath.isClosed!;
            const paths = shapePath.paths!;
            if (frame < shapePath.paths![0].startFrame) {
                this.drawPath(shapePath.paths![0].fromPath!);
                if (this.isInvertedMask) {
                    this.endHole();
                }
                drawnMask = true;
            }
            shapePath.paths!.some(animData => {
                if (animData.startFrame === animData.endFrame) {
                    return false;
                }
                if (animData.startFrame <= frame && frame <= animData.endFrame) {
                    if (!animData.fromPath) {
                        return false;
                    }
                    const animatePath = MaskElement.createAnimatePath(animData, frame);
                    this.drawPath(animatePath);
                    if (this.isInvertedMask) {
                        this.endHole();
                    }
                    drawnMask = true;
                    return true;
                }
                return false;
            });
            const lastPath = paths[paths.length - 2];
            if (lastPath.endFrame <= frame) {
                this.drawPath(lastPath.toPath!);
                if (this.isInvertedMask) {
                    this.endHole();
                }
                drawnMask = true;
            }
        } else if (this.inFrame <= frame && frame <= this.outFrame) {
            this.isClosed = shapePath.isClosed!;

            this.drawPath(shapePath);
            if (this.isInvertedMask) {
                this.endHole();
            }
            drawnMask = true;
        }
        return drawnMask;
    }

    setupScreenSize(): void {
        const ae = this.root()!;
        this.screenWidth = ae.width;
        this.screenHeight = ae.height;
    }

    drawAllMask(frame: number): boolean {
        let drawnMask = false;
        if (this.inFrame <= frame && frame <= this.outFrame && this.isInvertedMask) {
            if (!this.screenWidth || !this.screenHeight) {
                this.setupScreenSize();
            }
            this.beforeDraw();
            const x = -this.screenWidth / 2;
            const y = -this.screenHeight / 2;
            const w = this.screenWidth * 2;
            const h = this.screenHeight * 2;
            this.moveTo(x, y);
            this.lineTo(x + w, y);
            this.lineTo(x + w, y + h);
            this.lineTo(x, y + h);
            this.afterDraw();
            drawnMask = true;
        }
        this.maskShapePaths.forEach(shapePath => {
            if (this.drawMask(frame, shapePath)) {
                drawnMask = true;
            }
        });
        return drawnMask;
    }

    privateUpdateWithFrame(frame: number): boolean {
        if (this.maskMode === MASK_MODE.NONE) {
            return false;
        }
        this.clear();
        return this.drawAllMask(frame);
    }
}
