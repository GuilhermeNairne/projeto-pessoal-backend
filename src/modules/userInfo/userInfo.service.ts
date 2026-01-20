import {
  CognitoIdentityProviderClient,
  GetUserCommand,
} from '@aws-sdk/client-cognito-identity-provider';
import { HttpException, Injectable } from '@nestjs/common';

@Injectable()
export class UserInfoService {
  async getUserInfo(token: string) {
    try {
      const client = new CognitoIdentityProviderClient({ region: 'us-east-2' });
      const command = new GetUserCommand({ AccessToken: token });
      const response = await client.send(command);
      const attrs = Object.fromEntries(
        response?.UserAttributes?.map((a) => [a.Name, a.Value]) || [],
      );

      return {
        name: attrs.name,
        picture: attrs.picture,
      };
    } catch (error) {
      console.log(error);
      throw new HttpException(
        error.response ?? 'Erro ao buscar informações do usuário',
        error.status ?? 500,
      );
    }
  }
}
