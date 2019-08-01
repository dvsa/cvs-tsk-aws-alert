import { IAM } from 'aws-sdk';
import { ClientConfiguration, User, DeleteUserRequest } from 'aws-sdk/clients/iam';
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

    public async getExpiringUsers(days: number, dryRun: boolean): Promise<GetUserResponse[]> {
        let client: IAM = AwsXRay.captureAWSClient(new IAM(this.config));
        this.logger.info('Retrieving users');

        let failUsers: GetUserResponse[] = [];
        let users = await client
            .listUsers()
            .promise()
            .then((value): User[] => value.Users);
        const failDate = moment()
            .subtract(days, 'days')
            .toDate();
        for await (let user of users) {
            // If password was never used (usually a service account)
            if (!user.PasswordLastUsed) {
                const resp: GetUserResponse = {
                    user: user,
                    reason: 'never had a password',
                };
                this.logger.info(`${resp.user.UserName}: ${resp.reason}`);
                failUsers.push(resp);
                continue;
            }
            // Check whether user hasn't logged in for specified period
            if (user.PasswordLastUsed < failDate) {
                let dayDiff = moment().diff(user.PasswordLastUsed, 'days');
                const resp: GetUserResponse = {
                    user: user,
                    reason: `hasn't logged in for ${dayDiff} days`,
                    days: dayDiff,
                };
                // and delete them if they haven't logged in for >= 90 days
                if (days == 90 && dayDiff >= 90 && !dryRun) {
                    this.logger.info(`Deleting user: ${user.UserName}`);
                    const req: DeleteUserRequest = {
                        UserName: user.UserName,
                    };
                    await client.deleteUser(req).promise();
                    resp.reason += ' and has been deleted';
                }
                this.logger.info(`${user.UserName}: ${resp.reason}`);
                failUsers.push(resp);
                continue;
            }

            this.logger.info(`${user.UserName} is ok`);
        }
        return failUsers;
    }
}
