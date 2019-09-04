declare module 'handler' {
    export interface CWRuleEvent {
        days: number;
        dryRun: boolean;
        keys?: boolean;
    }

    export interface AWSAlertResult {
        message: string;
    }
}
