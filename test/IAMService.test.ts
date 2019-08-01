import { IAMService } from '../src/services/IAMService';
import { GetUserResponse } from 'IAMService';

const iamService = new IAMService({});
const failDate = new Date(Date.now() - 30);
it('retrieved the list of users', async (): Promise<void> => {
    const users = await iamService.getExpiringUsers(30);
    expect(users).toBeDefined();
    expect(users.length).toBeGreaterThan(0);
});

describe('each user', (): void => {
    it('should be flagged for not using account for >30 days or for not having a password', async () => {
        const users = await iamService.getExpiringUsers(30);
        users.forEach((user: GetUserResponse): void => {
            if (user.user.PasswordLastUsed) {
                expect(user.user.PasswordLastUsed.valueOf()).toBeLessThan(failDate.valueOf());
            } else {
                expect(user.reason).toMatch('never had a password');
            }
        });
    });

    it('has a username which is an email address', async () => {
        const users = await iamService.getExpiringUsers(30);
        users.forEach((user: GetUserResponse): void => {
            if (user.user.PasswordLastUsed) {
                expect(user.user.UserName).toMatch(
                    /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                );
            } else {
                console.warn(`${user.user.UserName} is probably a service account, please check`);
            }
        });
    });
});
