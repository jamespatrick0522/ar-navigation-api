import {createHash, randomBytes, timingSafeEqual} from 'crypto';

const HASH_PREFIX = 'sha256';

export function hashAdminPassword(password: string, salt = randomBytes(16).toString('hex')) {
  const normalized = password ?? '';
  const digest = createHash('sha256').update(`${salt}:${normalized}`).digest('hex');
  return `${HASH_PREFIX}$${salt}$${digest}`;
}

export function verifyAdminPassword(password: string, storedHash: string) {
  const [prefix, salt, digest] = (storedHash ?? '').split('$');
  if (prefix !== HASH_PREFIX || !salt || !digest) return false;

  const candidate = hashAdminPassword(password, salt).split('$')[2];
  const candidateBuffer = Buffer.from(candidate, 'hex');
  const digestBuffer = Buffer.from(digest, 'hex');
  return candidateBuffer.length === digestBuffer.length && timingSafeEqual(candidateBuffer, digestBuffer);
}
