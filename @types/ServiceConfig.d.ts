declare module 'ServiceConfig' {
    interface NotifyConfig {
        lambdaName: string;
        templateId: string;
    }

    interface AWSAlertConfig {
        lambdaConfig: import('aws-sdk/clients/lambda').ClientConfiguration;
        iamConfig: import('aws-sdk/clients/iam').ClientConfiguration;
        notifyConfig: NotifyConfig;
    }
}
