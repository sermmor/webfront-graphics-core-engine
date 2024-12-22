import { Point } from "../wrappers/point";

export const distanceVector2 = (p1: Point, p2: Point) => (
    Math.sqrt(
        Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
    )
);

export const roundToNextDecimal = (number: number, decimalPrecision: number): number => {
    let precision = decimalPrecision;
    if (precision < 1) {
        let fromDecimalToOne = precision;
        let numberOfLeftZeros = 0;
        while (fromDecimalToOne < 1) {
            fromDecimalToOne *= 10;
            numberOfLeftZeros++;
        }
        precision = Math.pow(10, numberOfLeftZeros);
    }
    return Math.round(number * precision) / precision;
};

export const incrementWithModule = (toIncrement: number, moduleN: number): number => {
    let incremented = toIncrement + 1;
    if (incremented >= moduleN) {
        incremented = 0;
    }
    return incremented;
}
