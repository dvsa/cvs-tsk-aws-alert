import { Lambda } from 'aws-sdk';
import { ClientConfiguration, InvocationRequest } from 'aws-sdk/clients/lambda';
import { GetUserResponse } from 'IAMService';
import { NotifyConfig } from 'ServiceConfig';
// @ts-ignore
import AwsXRay from 'aws-xray-sdk';
import * as env from 'env-var';

export class NotifyService {
    private readonly config: ClientConfiguration;

    public constructor(config?: ClientConfiguration) {
        this.config = config ? config : { region: env.get('AWS_REGION', 'eu-west-1').asString() };
    }

    public async notify(resp: GetUserResponse, notifyConfig: NotifyConfig, dryRun: boolean = false): Promise<void> {
        const client: Lambda = AwsXRay.captureAWSClient(new Lambda(this.config));
        let params: InvocationRequest = {
            FunctionName: notifyConfig.lambdaName,
            InvocationType: 'Event',
            Payload: {
                messageType: 'email',
                to: resp.user.UserName,
                templateId: notifyConfig.templateId,
                templateVars: {
                    reason: resp.reason,
                },
            },
        };
        if (!dryRun) {
            await client.invoke(params);
        }
    }
}
