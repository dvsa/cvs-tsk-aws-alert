import { SecretsManager } from 'aws-sdk';
import { ClientConfiguration, GetSecretValueRequest } from 'aws-sdk/clients/secretsmanager';
import * as env from 'env-var';
import { Category } from 'typescript-logging';
// @ts-ignore
import AwsXRay from 'aws-xray-sdk';
import { AWSAlertConfig } from 'ServiceConfig';
import { handlerLogger } from '../handler';

export class ServiceConfig {
    private readonly secretConfig: ClientConfiguration;
    private request: GetSecretValueRequest;
    public config: AWSAlertConfig | undefined;
    public readonly environment: string;
    public logger: Category;

    public constructor() {
        this.secretConfig = { region: env.get('AWS_REGION', 'eu-west-1').asString() };
        this.environment = env
            .get('ENVIRONMENT')
            .required()
            .asString();
        this.request = { SecretId: `cvs-tsk-aws-alert-config-${this.environment}` };
        this.logger = new Category('ServiceConfig', handlerLogger);
    }

    public async setConfig(value?: AWSAlertConfig): Promise<AWSAlertConfig> {
        if (value) return (this.config = value);
        this.logger.info(`Retrieving config: ${this.request.SecretId} from SecretsManager`);
        const client: SecretsManager = AwsXRay.captureAWSClient(new SecretsManager(this.secretConfig));
        let data = await client.getSecretValue(this.request).promise();
        if (typeof data.SecretString == 'string')
            return (this.config = JSON.parse(data.SecretString) as AWSAlertConfig);
        throw new Error('Failed to parse Json in Secret');
    }

    public async getConfig(): Promise<AWSAlertConfig> {
        if (this.config) {
            this.logger.info('Config already retrieved');
            return this.config;
        }
        return await this.setConfig();
    }

    public setSecret(secretName: string): void {
        this.request.SecretId = secretName;
    }
}
