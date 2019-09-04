declare module 'IAMService' {
    export interface GetUserResponse {
        user: import('aws-sdk/clients/iam').User;
        reason: string;
        days?: number;
        keys?: import('aws-sdk/clients/iam').AccessKeyMetadata[];
    }
}
