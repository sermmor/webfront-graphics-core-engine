export const waitForMilliseconds = (ms: number) => {
    return new Promise(resolve => setTimeout(resolve, ms));
};

export const waitUntilCondition = (isInConditionToWait: () => boolean, onFinishedWaiting: () => void) => {
    setTimeout(
        () => {
            if (isInConditionToWait()) {
                waitUntilCondition(isInConditionToWait, onFinishedWaiting);
            } else {
                onFinishedWaiting();
            }
        },
        0
    );
};

// const sleep = async (fn: (...args: number[]) => void, ...args: number[]) => {
//     await waitForMilliseconds(3000);
//     return fn(...args);
// };
