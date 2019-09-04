import { Lambda } from 'aws-sdk';
import { ClientConfiguration } from 'aws-sdk/clients/lambda';
import { GetUserResponse } from 'IAMService';
import { NotifyConfig } from 'ServiceConfig';
import { NotifyEmailRequest, NotifyTeamsRequest, TeamsSection } from 'NotifyService';
// @ts-ignore
import AwsXRay from 'aws-xray-sdk';
import * as env from 'env-var';

export class NotifyService {
    private readonly config: ClientConfiguration;

    public constructor(config?: ClientConfiguration) {
        this.config = config ? config : { region: env.get('AWS_REGION', 'eu-west-1').asString() };
    }

    /**
     * Notify the Development Channel about users with expiring keys.
     *
     * @param {GetUserResponse[]} resp An array of users and their respective keys.
     * @param {NotifyConfig} nConf notify config retrieved earlier.
     * @returns {Promise} The promise for invoking devops-notify
     */
    public async notifyTeams(resp: GetUserResponse[], nConf: NotifyConfig): Promise<unknown> {
        const tPayload: NotifyTeamsRequest = {
            messageType: 'teams',
            webHookUrl: nConf.webHookUrl,
            body: {
                '@type': 'MessageCard',
                '@context': 'https://schema.org/extensions',
                summary: 'Users with expiring keys',
                title: 'List of Users with expiring keys',
                themeColor: 'EF2929',
                sections: [
                    {
                        activityTitle: 'AWS Alert',
                        activitySubtitle: 'Users with expiring keys',
                        facts: [],
                    },
                ],
            },
        };
        for await (let user of resp) {
            if (user.keys) {
                let section: TeamsSection = {
                    activityTitle: user.user.UserName,
                    activitySubtitle: ``,
                    facts: [],
                };
                for await (let key of user.keys) {
                    if (key.AccessKeyId && key.Status) {
                        section.facts.push({ name: key.AccessKeyId, value: key.Status });
                    }
                }
                tPayload.body.sections.push(section);
            }
        }
        const client: Lambda = AwsXRay.captureAWSClient(new Lambda(this.config));
        return client
            .invoke({
                FunctionName: nConf.lambdaName,
                InvocationType: 'Event',
                Payload: JSON.stringify(tPayload),
            })
            .promise();
    }

    /**
     * Notify the user about their account and keys.
     *
     * @param {GetUserResponse} resp The user response from IAMService
     * @param {NotifyConfig} nConf notify config retrieved from ServiceConfig
     * @returns {Promise} The promise from lambda invoke.
     */
    public async notifyEmail(resp: GetUserResponse, nConf: NotifyConfig): Promise<unknown> {
        let emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        const ePayload: NotifyEmailRequest = {
            messageType: 'email',
            to: resp.user.UserName.match(emailRegex) ? resp.user.UserName : nConf.defaultEmail,
            templateId: nConf.templateId,
            templateVars: {
                reason: resp.reason,
            },
        };
        const client: Lambda = AwsXRay.captureAWSClient(new Lambda(this.config));
        return client
            .invoke({
                FunctionName: nConf.lambdaName,
                InvocationType: 'Event',
                Payload: JSON.stringify(ePayload),
            })
            .promise();
    }
}
