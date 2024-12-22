import { NgZone } from '../common-components/update-event-manager';

export class MockNgZoneWithTimeout implements NgZone {
    runOutsideAngular<T>(fn: (...args: any[]) => T): T {
        setTimeout(() => fn(), 0);
        return <T> {};
    }
}

export class MockNgZone implements NgZone {
    runOutsideAngular<T>(fn: (...args: any[]) => T): T {
        return fn();
    }
}
