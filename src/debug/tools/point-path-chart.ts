// import chartJs = require('chart.js');
// import { Point } from '../../wrappers/point';
// import { roundToNextDecimal } from '../../math-utils/math-extensions';
// const Chart = chartJs;

// export interface PointToHighlight {
//     label: string;
//     point: Point;
//     color: string;
// }

// // Draw a Point Chart
// export class PointPathChart {
//     currentChart: Chart;

//     constructor(
//         private context: string | CanvasRenderingContext2D | HTMLCanvasElement | ArrayLike<CanvasRenderingContext2D | HTMLCanvasElement>
//     ) {

//     }

//     drawPointsPath(cloudOfPoints: Point[], pointsToHighlight: PointToHighlight[], xPrecision: number) {
//         const [labelsNumber, dataSet]: number[][] = this.parseFromPointsToData(cloudOfPoints);
//         const labels = labelsNumber.map(n => roundToNextDecimal(n, xPrecision).toString());

//         if (this.currentChart) {
//             this.currentChart.clear();
//             this.currentChart.destroy();
//         }

//         const datasets = this.createDataSets(cloudOfPoints, pointsToHighlight, dataSet);

//         this.currentChart = new Chart(this.context, {
//             type: 'line',
//             data: {
//                 labels,
//                 datasets
//             },
//             options: {
//                 onHover: undefined,
//             }
//         });
//     }

//     private createDataSets(
//             cloudOfPoints: Point[], pointsToHighlight: PointToHighlight[], data: number[]): chartJs.ChartDataSets[] | undefined {
//         const pointBackgroundColors: string[] = this.getPointsBackgroundColors(cloudOfPoints, pointsToHighlight);

//         const allDataSets: chartJs.ChartDataSets[] | undefined = [{
//             data,
//             label: 'other degrees',
//             borderWidth: 0,
//             pointBackgroundColor: pointBackgroundColors,
//             pointHoverBackgroundColor: undefined,
//             pointHoverBorderColor: undefined,
//             pointHoverBorderWidth: 0,
//             pointHoverRadius: 0,
//         }];

//         const toAddToDataSet: chartJs.ChartDataSets[] | undefined = pointsToHighlight.map(toHighlight => {
//             return {
//                 label: toHighlight.label,
//                 borderColor: toHighlight.color,
//                 backgroundColor: toHighlight.color,
//             };
//         });
//         allDataSets.push(...toAddToDataSet);
//         return allDataSets;
//     }

//     private getPointsBackgroundColors(
//         cloudOfPoints: Point[], pointsToHighlight: PointToHighlight[]): string[] {
//         const pointBackgroundColors: string[] = [];
//         let currentColor = '';
//         const indexPointsToHightlight: number[] = this.getIndexPointToHighlight(cloudOfPoints, pointsToHighlight);
//         let currentIndexToHighlight = 0;

//         for (let i = 0; i < cloudOfPoints.length; i++) {
//             if (indexPointsToHightlight[currentIndexToHighlight] === i) {
//                 currentColor = pointsToHighlight[currentIndexToHighlight].color;
//                 currentIndexToHighlight++;
//             }
//             pointBackgroundColors.push(currentColor);
//         }

//         return pointBackgroundColors;
//     }

//     private getIndexPointToHighlight(cloudOfPoints: Point[], pointsToHighlight: PointToHighlight[]): number[] {
//         const indexToHighlight: number[] = [];

//         cloudOfPoints.forEach((point: Point, index: number) => {
//             if (point.x >= pointsToHighlight[indexToHighlight.length].point.x) {
//                 indexToHighlight.push(index);
//             }
//         });

//         if (indexToHighlight.length < pointsToHighlight.length) {
//             indexToHighlight.push(cloudOfPoints.length - 1);
//         }

//         return indexToHighlight;
//     }

//     private parseFromPointsToData(cloudOfPoints: Point[]): number[][] {
//         return [
//             cloudOfPoints.map(p => p.x),
//             cloudOfPoints.map(p => p.y)
//         ];
//     }
// }
