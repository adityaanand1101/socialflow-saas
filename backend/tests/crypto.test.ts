import { encryptToken, decryptToken } from '../utils/crypto';

describe('Token Encryption Utility', () => {
  const SECRET_KEY = 'test_encryption_key_that_is_long_enough';

  it('should encrypt and decrypt a token correctly', () => {
    const originalToken = 'mock_oauth_access_token_12345';
    
    const encrypted = encryptToken(originalToken, SECRET_KEY);
    expect(encrypted).not.toBe(originalToken);
    expect(encrypted.split(':').length).toBe(3); // iv:encrypted:authTag

    const decrypted = decryptToken(encrypted, SECRET_KEY);
    expect(decrypted).toBe(originalToken);
  });

  it('should throw an error if decrypting invalid format', () => {
    expect(() => {
      decryptToken('invalid_encrypted_text', SECRET_KEY);
    }).toThrow('Invalid encrypted text format');
  });
});
