export const isAnArc = (stroke: StrokeLine) => (<any> stroke).radius;
export const isAStraightLine = (stroke: StrokeLine) => stroke.xToDraw && stroke.yToDraw && !isAnArc(stroke);

export interface StrokeLine {
    xToDraw: number;
    yToDraw: number;
}

export interface Arc extends StrokeLine {
    radius: number;
    startAngle: number;
    endAngle: number;
    anticlockwise?: boolean;
}

export interface StraightLine extends StrokeLine {
    
}
