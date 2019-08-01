declare module "IAMService" {
    import {User} from "aws-sdk/clients/iam";

    interface GetUserResponse {
        user: User;
        reason: string;
    }
}
