import { Point } from "../../wrappers/point";
import { Equation } from "./types";

export const bezierCubic = (p1: Point, p2: Point): Equation => {
    return (percentageTime: number) => 3 * Math.pow((1 - percentageTime), 2) * percentageTime * p1.x
        + 3 * (1 - percentageTime) * Math.pow(percentageTime, 2) * p2.x + Math.pow(percentageTime, 3);
};