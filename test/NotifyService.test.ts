import { NotifyService } from '../src/services/NotifyService';

describe('When NotifyService is called', () => {
    beforeAll(() => {
        NotifyService.mockImplementation(() => {
            return {
                notify: () => {
                    return 'Done';
                },
            };
        });
    });
});
