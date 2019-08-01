import { Context, Handler } from 'aws-lambda';

import { ServiceConfig } from './utils/ServiceConfig';
import { NotifyService } from './services/NotifyService';
import { IAMService } from './services/IAMService';

import { AWSAlertResult, CWRuleEvent } from 'handler';
import { Category, CategoryConfiguration, CategoryServiceFactory, LogLevel } from 'typescript-logging';

CategoryServiceFactory.setDefaultConfiguration(new CategoryConfiguration(LogLevel.Info));
export const handlerLogger = new Category('handler');

export const handler: Handler<CWRuleEvent, AWSAlertResult> = async (
    event: CWRuleEvent,
    context: Context,
): Promise<AWSAlertResult> => {
    const logger = handlerLogger;
    const config: ServiceConfig = await new ServiceConfig();
    return new Promise<AWSAlertResult>(
        async (resolve, reject): Promise<void> => {
            await config
                .getConfig()
                .then(
                    async (value): Promise<void> => {
                        const iam = new IAMService(value.iamConfig);
                        const notify = new NotifyService(value.lambdaConfig);
                        logger.info(`days: ${event.days}`);
                        logger.info(`requestId: ${context.awsRequestId}`);
                        const users = await iam.getExpiringUsers(event.days);
                        await Promise.all(
                            users.map(
                                async (user): Promise<void> => {
                                    logger.info(`user: ${user.user}, reason: ${user.reason}`);
                                    await notify.notify(user, value.notifyConfig, event.dryRun);
                                },
                            ),
                        );
                        resolve({ message: `Notified ${users.length} users` });
                    },
                )
                .catch((e: Error): void => {
                    reject(e);
                });
        },
    );
};

export default handler;
