import { IAM } from 'aws-sdk';
import {
    ClientConfiguration,
    User,
    DeleteUserRequest,
    ListAccessKeysRequest,
    ListAccessKeysResponse,
    UpdateAccessKeyRequest,
    AccessKeyMetadata,
} from 'aws-sdk/clients/iam';
import { GetUserResponse } from 'IAMService';
import { Category } from 'typescript-logging';
import { handlerLogger } from '../handler';
import * as env from 'env-var';
import moment = require('moment');

// @ts-ignore
import AwsXRay from 'aws-xray-sdk';

/**
 * IAMService class
 *
 * Functions requiring access/configuration for IAM aws-sdk clients.
 */
export class IAMService {
    private readonly config: ClientConfiguration;
    private logger: Category;

    public constructor(config: ClientConfiguration) {
        this.config =
            Object.keys(config).length !== 0 ? config : { region: env.get('AWS_REGION', 'eu-west-1').asString() };
        this.logger = new Category('IAMService', handlerLogger);
    }

    /**
     * Retrieve all users in account and return a list of GetUserResponse
     *
     * @param {number} days  Amount of days to check against (now() - days) is the failure date
     * @param {boolean} dryRun  If true this function will not delete
     * @returns {Promise<GetUserResponse[]>} an array of 'GetUserResponse's
     */
    public async getExpiringUsers(days: number, dryRun?: boolean): Promise<GetUserResponse[]> {
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
                let keys = await this.checkAccessKeys(user, dryRun);
                if (keys.length > 0) {
                    this.logger.info(`Found ${keys.length} key(s)`);
                    resp.keys = keys;
                }
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
                // no need to check keys if the user has been deleted.
                if (!resp.reason.endsWith('deleted')) {
                    let keys = await this.checkAccessKeys(user, dryRun);
                    // could be empty (all keys are okay)
                    if (keys.length > 0) {
                        resp.keys = keys;
                    }
                }
                this.logger.info(`${user.UserName}: ${resp.reason}`);
                failUsers.push(resp);
            }
        }
        return failUsers;
    }

    /**
     * Retrieve all user access keys and deactivate them if older than 90 days
     *
     * @param {User} user The user to check
     * @param {boolean} dryRun If true we won't deactivate the key
     * @returns {Promise<AccessKeyMetadata[]>} an array of 'ExpiredAccessKeyResponse's containing the key and the status
     */
    private async checkAccessKeys(user: User, dryRun?: boolean): Promise<AccessKeyMetadata[]> {
        let client: IAM = AwsXRay.captureAWSClient(new IAM(this.config));
        let keys: AccessKeyMetadata[] = [];
        let req: ListAccessKeysRequest = {
            UserName: user.UserName,
        };
        this.logger.info(`Checking keys for ${user.UserName}`);
        let resp: ListAccessKeysResponse = await client.listAccessKeys(req).promise();
        for (let key of resp.AccessKeyMetadata) {
            let dayDiff = moment().diff(key.CreateDate, 'days');
            // Give user a reminder of their access keys when there are 20 days to go
            if (key.AccessKeyId && dayDiff >= 70) {
                // key has not been used for more than 90 days, deactivate
                if (dayDiff >= 90 && !dryRun) {
                    let req: UpdateAccessKeyRequest = {
                        AccessKeyId: key.AccessKeyId,
                        Status: 'Inactive',
                    };
                    await client.updateAccessKey(req).promise();
                    key.Status = 'Inactive';
                }
                keys.push(key);
            }
        }
        return keys;
    }
}
