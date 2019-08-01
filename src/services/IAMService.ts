import { IAM, AWSError } from 'aws-sdk';
import { ClientConfiguration, ListUsersResponse, User } from 'aws-sdk/clients/iam';
import { PromiseResult } from 'aws-sdk/lib/request';
import { GetUserResponse } from 'IAMService';
// @ts-ignore
import AwsXRay from 'aws-xray-sdk';
import { Category } from 'typescript-logging';
import { handlerLogger } from '../handler';
import * as env from 'env-var';
import moment = require('moment');

export class IAMService {
    private readonly config: ClientConfiguration;
    private logger: Category;

    public constructor(config: ClientConfiguration) {
        this.config =
            Object.keys(config).length !== 0 ? config : { region: env.get('AWS_REGION', 'eu-west-1').asString() };
        this.logger = new Category('IAMService', handlerLogger);
    }

    public async getExpiringUsers(days: number): Promise<GetUserResponse[]> {
        let client: IAM = AwsXRay.captureAWSClient(new IAM(this.config));
        this.logger.info('Retrieving users');
        let failUsers: GetUserResponse[] = [];
        await client
            .listUsers()
            .promise()
            .then((data: PromiseResult<ListUsersResponse, AWSError>): void => {
                if (data.$response && data.$response.error != null)
                    throw new Error(`Failed to list users: ${data.$response.error}`);
                let users: User[] = data.Users;
                const failDate = moment()
                    .subtract(days, 'days')
                    .toDate();
                for (let user of users) {
                    if (!user.PasswordLastUsed) {
                        const resp: GetUserResponse = {
                            user: user,
                            reason: 'never had a password',
                        };
                        this.logger.info(`${resp.user.UserName}: ${resp.reason}`);
                        failUsers.push(resp);
                    } else if (user.PasswordLastUsed < failDate) {
                        const resp: GetUserResponse = {
                            user: user,
                            reason: `hasn't logged in for: ${days} days, last login: ${user.PasswordLastUsed.toDateString()}`,
                        };
                        this.logger.info(`${resp.user.UserName}: ${resp.reason}`);
                        failUsers.push(resp);
                    } else {
                        this.logger.info(`${user.UserName} is ok`);
                    }
                }
            });
        return failUsers;
    }
}
