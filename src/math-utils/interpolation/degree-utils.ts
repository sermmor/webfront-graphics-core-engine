export const completeRotation = 360;

export const parseToPositiveDegree = (degree: number): number => {
    while (degree < 0) {
        degree += completeRotation;
    }
    return degree;
};
