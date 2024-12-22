import { filters as PIXI_filters } from 'pixi.js';
import { Container } from '../container';
import { Color } from '../color';

export class CoreFilter {
    private static _instance: CoreFilter;

    constructor(private isPixiWebGl: boolean) {
        CoreFilter._instance = this;
    }

    static get instance(): CoreFilter {
        return CoreFilter._instance;
    }

    clearAllFilters = (container: Container) => {
        if (CoreFilter._instance.isPixiWebGl && container) {
            container.filters = [];
        }
    }

    createABlurFilter(strength?: number, quality?: number, resolution?: number, kernelSize?: number): PIXI_filters.BlurFilter | undefined {
        if (CoreFilter.instance.isPixiWebGl) {
            return new PIXI_filters.BlurFilter(strength, quality, resolution, kernelSize);
        }
        return undefined;
    }

    applyblurFilter = (container: Container, strength?: number, quality?: number, resolution?: number, kernelSize?: number) => {
        if (CoreFilter.instance.isPixiWebGl) {
            container.filters = [new PIXI_filters.BlurFilter(strength, quality, resolution, kernelSize)];
        }
    }

    applyColorMatrixFilter = (container: Container, color: Color) => {
        if (CoreFilter._instance.isPixiWebGl && container) {
            let colorMatrix = new PIXI_filters.ColorMatrixFilter();
            colorMatrix.matrix[0] = color.r / 255;
            colorMatrix.matrix[6] = color.g / 255;
            colorMatrix.matrix[12] = color.b / 255;
            container.filters = [colorMatrix];
        }
    }
}
