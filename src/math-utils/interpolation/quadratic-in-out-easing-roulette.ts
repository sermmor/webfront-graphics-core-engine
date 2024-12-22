import { Equation } from './types';

/**
 * https://github.com/photonstorm/phaser/blob/master/src/math/easing/quadratic/InOut.js
 * @param {number} percentageTime
 */
const calcQuadraticInOut = (percentageTime: number): number => {
    let value: number;

    if ((percentageTime *= 2) < 1) {
        value = 0.5 * percentageTime * percentageTime;
    } else {
        value = -0.5 * (--percentageTime * (percentageTime - 2) - 1);
    }

    return value;
};

export const quadraticInOut = (): Equation => calcQuadraticInOut;
