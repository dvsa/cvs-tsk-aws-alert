import { ServiceConfig } from '../src/utils/ServiceConfig';
import { AWSAlertConfig } from 'ServiceConfig';

const fakeConf: AWSAlertConfig = {
    lambdaConfig: {},
    iamConfig: {},
    notifyConfig: {
        lambdaName: 'devops-notify',
        templateId: 'asdf',
    },
};
const serviceConfig = new ServiceConfig();
beforeEach(() => {
    serviceConfig.config = undefined;
});

it('retrieves the config from secrets manager', async () => {
    await expect(serviceConfig.getConfig()).resolves.toStrictEqual(fakeConf);
});

it('throws an error if it cannot retrieve the secret', async () => {
    serviceConfig.setSecret('asdf');
    await expect(serviceConfig.getConfig()).rejects.toThrowError();
    serviceConfig.setSecret(`cvs-tsk-aws-alert-config-${serviceConfig.environment}`);
});

it('should set the example config', async () => {
    let conf = await serviceConfig.setConfig(fakeConf);
    expect(conf).toStrictEqual(fakeConf);
});

it('should return the config if already set', async () => {
    await serviceConfig.setConfig(fakeConf);
    let conf = await serviceConfig.getConfig();
    expect(conf).toStrictEqual(fakeConf);
});
