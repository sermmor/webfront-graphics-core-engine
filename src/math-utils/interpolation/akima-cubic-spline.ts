// From https://github.com/chdh/commons-math-interpolation/blob/master/src/Akima.ts and https://github.com/chdh/commons-math-interpolation/blob/master/src/Utils.ts
import { Equation } from "./types";

// @ts-ignore: Number.EPSILON is not defined in ES5.
const EPSILON = Number.EPSILON || 2.2204460492503130808472633361816E-16;

/**
* Returns a function that computes a cubic spline interpolation for the data
* set using the Akima algorithm, as originally formulated by Hiroshi Akima in
* his 1970 paper "A New Method of Interpolation and Smooth Curve Fitting Based
* on Local Procedures."
* J. ACM 17, 4 (October 1970), 589-602. DOI=10.1145/321607.321609
* http://doi.acm.org/10.1145/321607.321609
*
* This implementation is based on the Akima implementation in the CubicSpline
* class in the Math.NET Numerics library. The method referenced is
* CubicSpline.InterpolateAkimaSorted.
*
* Returns a polynomial spline function consisting of n cubic polynomials,
* defined over the subintervals determined by the x values,
* x[0] < x[1] < ... < x[n-1].
* The Akima algorithm requires that n >= 5.
*
* @param xVals
*    The arguments of the interpolation points, in strictly increasing order.
* @param yVals
*    The values of the interpolation points.
* @returns
*    A function which interpolates the dataset.
*/
export function createAkimaSplineInterpolator(xVals: ArrayLike<number>, yVals: ArrayLike<number>) : Equation {
   const segmentCoeffs = computeAkimaPolyCoefficients(xVals, yVals);
   const xValsCopy = Float64Array.from(xVals);                       // clone to break dependency on passed values
   return (x: number) => evaluatePolySegment(xValsCopy, segmentCoeffs, x);
}

/**
* Computes the polynomial coefficients for the Akima cubic spline
* interpolation of a dataset.
*
* @param xVals
*    The arguments of the interpolation points, in strictly increasing order.
* @param yVals
*    The values of the interpolation points.
* @returns
*    Polynomial coefficients of the segments.
*/
export function computeAkimaPolyCoefficients(xVals: ArrayLike<number>, yVals: ArrayLike<number>) : Float64Array[] {
   if (xVals.length != yVals.length) {
      throw new Error("Dimension mismatch for xVals and yVals.");
   }
   if (xVals.length < 5) {
      throw new Error("Number of points is too small.");
   }
   checkStrictlyIncreasing(xVals);
   const n = xVals.length - 1;                                       // number of segments

   const differences = new Float64Array(n);
   const weights = new Float64Array(n);

   for (let i = 0; i < n; i++) {
      differences[i] = (yVals[i + 1] - yVals[i]) / (xVals[i + 1] - xVals[i]);
   }

   for (let i = 1; i < n; i++) {
      weights[i] = Math.abs(differences[i] - differences[i - 1]);
   }

   // Prepare Hermite interpolation scheme.
   const firstDerivatives = new Float64Array(n + 1);

   for (let i = 2; i < n - 1; i++) {
      const wP = weights[i + 1];
      const wM = weights[i - 1];
      if (Math.abs(wP) < EPSILON && Math.abs(wM) < EPSILON) {
         const xv  = xVals[i];
         const xvP = xVals[i + 1];
         const xvM = xVals[i - 1];
         firstDerivatives[i] = (((xvP - xv) * differences[i - 1]) + ((xv - xvM) * differences[i])) / (xvP - xvM);
      } else {
         firstDerivatives[i] = ((wP * differences[i - 1]) + (wM * differences[i])) / (wP + wM);
      }
   }

   firstDerivatives[0]     = differentiateThreePoint(xVals, yVals, 0, 0, 1, 2);
   firstDerivatives[1]     = differentiateThreePoint(xVals, yVals, 1, 0, 1, 2);
   firstDerivatives[n - 1] = differentiateThreePoint(xVals, yVals, n - 1, n - 2, n - 1, n);
   firstDerivatives[n]     = differentiateThreePoint(xVals, yVals, n    , n - 2, n - 1, n);

   return computeHermitePolyCoefficients(xVals, yVals, firstDerivatives);
}

/**
* Three point differentiation helper, modeled off of the same method in the
* Math.NET CubicSpline class.
*
* @param xVals
*    x values to calculate the numerical derivative with.
* @param yVals
*    y values to calculate the numerical derivative with.
* @param indexOfDifferentiation
*    Index of the elemnt we are calculating the derivative around.
* @param indexOfFirstSample
*    Index of the first element to sample for the three point method.
* @param indexOfSecondsample
*    index of the second element to sample for the three point method.
* @param indexOfThirdSample
*    Index of the third element to sample for the three point method.
* @returns
*    The derivative.
*/
function differentiateThreePoint(xVals: ArrayLike<number>, yVals: ArrayLike<number>,
      indexOfDifferentiation: number, indexOfFirstSample: number,
      indexOfSecondsample: number, indexOfThirdSample: number) : number {

   const x0 = yVals[indexOfFirstSample];
   const x1 = yVals[indexOfSecondsample];
   const x2 = yVals[indexOfThirdSample];

   const t  = xVals[indexOfDifferentiation] - xVals[indexOfFirstSample];
   const t1 = xVals[indexOfSecondsample]    - xVals[indexOfFirstSample];
   const t2 = xVals[indexOfThirdSample]     - xVals[indexOfFirstSample];

   const a = (x2 - x0 - (t2 / t1 * (x1 - x0))) / (t2 * t2 - t1 * t2);
   const b = (x1 - x0 - a * t1 * t1) / t1;

   return (2 * a * t) + b;
}

/**
* Computes the polynomial coefficients for the Hermite cubic spline interpolation
* for a set of (x,y) value pairs and their derivatives. This is modeled off of
* the InterpolateHermiteSorted method in the Math.NET CubicSpline class.
*
* @param xVals
*    x values for interpolation.
* @param yVals
*    y values for interpolation.
* @param firstDerivatives
*    First derivative values of the function.
* @returns
*    Polynomial coefficients of the segments.
*/
function computeHermitePolyCoefficients(xVals: ArrayLike<number>, yVals: ArrayLike<number>, firstDerivatives: ArrayLike<number>) : Float64Array[] {
   if (xVals.length != yVals.length || xVals.length != firstDerivatives.length) {
      throw new Error("Dimension mismatch");
   }
   if (xVals.length < 2) {
      throw new Error("Not enough points.");
   }
   const n = xVals.length - 1;                                       // number of segments

   const segmentCoeffs = new Array(n);
   for (let i = 0; i < n; i++) {
      const w = xVals[i + 1] - xVals[i];
      const w2 = w * w;

      const yv  = yVals[i];
      const yvP = yVals[i + 1];

      const fd  = firstDerivatives[i];
      const fdP = firstDerivatives[i + 1];

      const coeffs = new Float64Array(4);
      coeffs[0] = yv;
      coeffs[1] = firstDerivatives[i];
      coeffs[2] = (3 * (yvP - yv) / w - 2 * fd - fdP) / w;
      coeffs[3] = (2 * (yv - yvP) / w + fd + fdP) / w2;
      segmentCoeffs[i] = trimPoly(coeffs);
   }
   return segmentCoeffs;
}

/*******************************************************************************************************************************/
/******************************************** UTILS ****************************************************************************/
/*******************************************************************************************************************************/
let evaluatePolySegment_i = 0;
// Evaluates the polynomial of the segment corresponding to the specified x value.
function evaluatePolySegment(xVals: ArrayLike<number>, segmentCoeffs: ArrayLike<number>[], x: number) : number {
   evaluatePolySegment_i = binarySearch(xVals, x);
   if (evaluatePolySegment_i < 0) {
      evaluatePolySegment_i = -evaluatePolySegment_i - 2;
   }
   evaluatePolySegment_i = Math.max(0, Math.min(evaluatePolySegment_i, segmentCoeffs.length - 1));
   return evaluatePoly(segmentCoeffs[evaluatePolySegment_i], x - xVals[evaluatePolySegment_i]);
}

// Checks that a number sequence is strictly increasing and all values are finite.
function checkStrictlyIncreasing(a: ArrayLike<number>) {
    for (let i = 0; i < a.length; i++) {
       if (!isFinite(a[i])) {
          throw new Error("Non-finite number detected.");
       }
       if (i > 0 && a[i] <= a[i - 1]) {
          throw new Error("Number sequence is not strictly increasing.");
       }
    }
}

// Trims top order polynomial coefficients which are zero.
function trimPoly(c: Float64Array) : Float64Array {
    let n = c.length;
    while (n > 1 && c[n - 1] == 0) {
       n--;
    }
    return (n == c.length) ? c : c.subarray(0, n);
}

let binarySearch_low = 0;
let binarySearch_high = 0;
let binarySearch_mid = 0;
let binarySearch_midVal = 0;
// Corresponds to java.util.Arrays.binarySearch().
// Returns the index of the search key, if it is contained in the array.
// Otherwise it returns -(insertionPoint + 1).
// The insertion point is defined as the point at which the key would be
// inserted into the array: the index of the first element greater than
// the key, or a.length if all elements in the array are less than the
// specified key.
function binarySearch(a: ArrayLike<number>, key: number) : number {
    binarySearch_low = 0;
    binarySearch_high = a.length - 1;
    while (binarySearch_low <= binarySearch_high) {
       binarySearch_mid = (binarySearch_low + binarySearch_high) >>> 1;
       binarySearch_midVal = a[binarySearch_mid];
       if (binarySearch_midVal < key) {
          binarySearch_low = binarySearch_mid + 1;
       } else if (binarySearch_midVal > key) {
          binarySearch_high = binarySearch_mid - 1;
       } else if (binarySearch_midVal == key) {
          return binarySearch_mid;
       } else {                                                       // values might be NaN
          throw new Error("Invalid number encountered in binary search.");
       }
    }
    return -(binarySearch_low + 1);                                                // key not found
}

let n = 0;
let v = 0;
// Evaluates the value of a polynomial.
// c contains the polynomial coefficients in ascending order.
function evaluatePoly(c: ArrayLike<number>, x: number) : number {
    const n = c.length;
    if (n == 0) {
       return 0;
    }
    let v = c[n - 1];
    for (let i = n - 2; i >= 0; i--) {
       v = x * v + c[i];
    }
    return v;
}
