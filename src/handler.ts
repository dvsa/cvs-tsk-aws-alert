import { Context, Handler } from 'aws-lambda';

import { ServiceConfig } from './utils/ServiceConfig';
import { NotifyService } from './services/NotifyService';
import { IAMService } from './services/IAMService';

import { AWSAlertResult, CWRuleEvent } from 'handler';
import { Category, CategoryConfiguration, CategoryServiceFactory, LogLevel } from 'typescript-logging';

CategoryServiceFactory.setDefaultConfiguration(new CategoryConfiguration(LogLevel.Info));
export const handlerLogger = new Category('handler');

/**
 * Lambda Handler
 *
 * @param {CWRuleEvent} event The event when invoking the lambda
 * @param {Context} context The Lambda runtime context
 * @returns {Promise<AWSAlertResult>} A simple message.
 */
export const handler: Handler<CWRuleEvent, AWSAlertResult> = async (
    event: CWRuleEvent,
    context: Context,
): Promise<AWSAlertResult> => {
    const logger = handlerLogger;
    const config: ServiceConfig = await new ServiceConfig();
    let sConfig = await config.getConfig();
    const iam = new IAMService(sConfig.iamConfig);
    const notify = new NotifyService(sConfig.lambdaConfig);
    return new Promise<AWSAlertResult>(
        async (): Promise<AWSAlertResult> => {
            try {
                logger.info(`days: ${event.days}`);
                logger.info(`requestId: ${context.awsRequestId}`);
                const users = await iam.getExpiringUsers(event.days, event.dryRun);
                await Promise.all([
                    users.map((user): Promise<unknown> => notify.notifyEmail(user, sConfig.notifyConfig)),
                    notify.notifyTeams(users, sConfig.notifyConfig),
                ]);
                return { message: `Notified ${users.length} users` };
            } catch (e) {
                throw e;
            }
        },
    );
};

export default handler;
