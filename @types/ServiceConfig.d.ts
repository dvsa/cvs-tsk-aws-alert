declare module 'ServiceConfig' {
    export interface NotifyConfig {
        lambdaName: string;
        webHookUrl: string;
        templateId: string;
        defaultEmail: string;
    }

    export interface AWSAlertConfig {
        lambdaConfig: import('aws-sdk/clients/lambda').ClientConfiguration;
        iamConfig: import('aws-sdk/clients/iam').ClientConfiguration;
        notifyConfig: NotifyConfig;
    }
}
