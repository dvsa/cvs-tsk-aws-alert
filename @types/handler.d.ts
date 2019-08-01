declare module "handler" {
    export interface CWRuleEvent {
        days: number;
        dryRun: boolean;
    }

    export interface AWSAlertResult {
        message: string;
    }
}
