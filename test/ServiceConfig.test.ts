import { ServiceConfig } from '../src/utils/ServiceConfig';
import { AWSAlertConfig } from 'ServiceConfig';

const fakeConf: AWSAlertConfig = {
    lambdaConfig: {},
    iamConfig: {},
    notifyConfig: {
        lambdaName: 'devops-notify',
        templateId: 'notATemplate',
        defaultEmail: '',
        webHookUrl: '',
    },
};
const serviceConfig = new ServiceConfig();
beforeEach((): void => {
    serviceConfig.config = undefined;
});

it('retrieves the config from secrets manager', async (): Promise<void> => {
    await expect(serviceConfig.getConfig()).resolves.toStrictEqual(fakeConf);
});

it('throws an error if it cannot retrieve the secret', async (): Promise<void> => {
    serviceConfig.setSecret('notASecret');
    await expect(serviceConfig.getConfig()).rejects.toThrowError();
    serviceConfig.setSecret(`cvs-tsk-aws-alert-config-${serviceConfig.environment}`);
});

it('should set the example config', async (): Promise<void> => {
    let conf = await serviceConfig.setConfig(fakeConf);
    expect(conf).toStrictEqual(fakeConf);
});

it('should return the config if already set', async (): Promise<void> => {
    await serviceConfig.setConfig(fakeConf);
    let conf = await serviceConfig.getConfig();
    expect(conf).toStrictEqual(fakeConf);
});
