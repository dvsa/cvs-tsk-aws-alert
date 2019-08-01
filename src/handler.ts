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
        async (): Promise<AWSAlertResult> => {
            try {
                let sConfig = await config.getConfig();
                const iam = new IAMService(sConfig.iamConfig);
                const notify = new NotifyService(sConfig.lambdaConfig);
                logger.info(`days: ${event.days}`);
                logger.info(`requestId: ${context.awsRequestId}`);
                const users = await iam.getExpiringUsers(event.days, event.dryRun);
                await Promise.all(users.map(user => notify.notify(user, sConfig.notifyConfig, event.dryRun)));
                return { message: `Notified ${users.length} users` };
            } catch (e) {
                throw e;
            }
        },
    );
};

export default handler;
