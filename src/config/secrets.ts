import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from '@aws-sdk/client-secrets-manager';

export async function getDatabaseUrl() {
  const client = new SecretsManagerClient({ region: 'your-aws-region' });

  const response = await client.send(
    new GetSecretValueCommand({
      SecretId: 'your-secret-name',
    }),
  );

  const secret = response.SecretString;
  if (!secret) throw new Error('SecretString is empty');

  // If the secret is a JSON with {"DATABASE_URL": "..."}
  const parsed = JSON.parse(secret);
  return parsed.DATABASE_URL;
}
