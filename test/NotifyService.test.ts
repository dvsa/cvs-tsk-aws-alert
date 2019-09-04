import { NotifyService } from '../src/services/NotifyService';
import { ServiceConfig } from '../src/utils/ServiceConfig';
import { GetUserResponse } from 'IAMService';

describe('When NotifyService is called', (): void => {
    const sConfig = new ServiceConfig().getConfig();
    const notifyService = new NotifyService();
    it('should notify', async (): Promise<void> => {
        let config = await sConfig;
        let user: GetUserResponse = {
            user: {
                UserId: '',
                UserName: 'asdfg@asdf.com',
                Path: '',
                Arn: '',
                CreateDate: new Date(),
            },
            reason: "hasn't logged in for 31 days",
        };
        await expect(notifyService.notifyEmail(user, config.notifyConfig)).resolves.toReturn();
    });
});
