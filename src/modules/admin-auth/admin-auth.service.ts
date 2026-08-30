import {Inject, Injectable, UnauthorizedException} from '@nestjs/common';
import {and, eq} from 'drizzle-orm';
import {createHmac, timingSafeEqual} from 'crypto';
import {DRIZZLE_DB} from 'src/db/db.module';
import {adminUsers} from 'src/db/schema';
import {verifyAdminPassword} from './admin-password';

type AdminTokenPayload = {
  sub: number;
  username: string;
  displayName: string;
  role: string;
  exp: number;
};

@Injectable()
export class AdminAuthService {
  private readonly tokenTtlSeconds = 60 * 60 * 12;

  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async login(username: string, password: string) {
    const normalizedUsername = (username ?? '').trim().toLowerCase();
    if (!normalizedUsername || !password) {
      throw new UnauthorizedException('Invalid admin username or password');
    }

    const [admin] = await this.db
      .select()
      .from(adminUsers)
      .where(and(eq(adminUsers.username, normalizedUsername), eq(adminUsers.isActive, true)))
      .limit(1);

    if (!admin || !verifyAdminPassword(password, admin.passwordHash)) {
      throw new UnauthorizedException('Invalid admin username or password');
    }

    await this.db
      .update(adminUsers)
      .set({lastLoginAt: new Date(), updatedAt: new Date()})
      .where(eq(adminUsers.id, admin.id));

    return {
      accessToken: this.signToken({
        sub: admin.id,
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
        exp: Math.floor(Date.now() / 1000) + this.tokenTtlSeconds,
      }),
      admin: this.toAdminDto(admin),
    };
  }

  async verifyToken(token: string) {
    const payload = this.verifySignedToken(token);
    const [admin] = await this.db
      .select()
      .from(adminUsers)
      .where(and(eq(adminUsers.id, payload.sub), eq(adminUsers.isActive, true)))
      .limit(1);

    if (!admin) {
      throw new UnauthorizedException('Admin account is inactive or missing');
    }

    return this.toAdminDto(admin);
  }

  private signToken(payload: AdminTokenPayload) {
    const encodedPayload = base64UrlEncode(JSON.stringify(payload));
    const signature = this.sign(encodedPayload);
    return `${encodedPayload}.${signature}`;
  }

  private verifySignedToken(token: string): AdminTokenPayload {
    const [encodedPayload, signature] = (token ?? '').split('.');
    if (!encodedPayload || !signature) {
      throw new UnauthorizedException('Missing admin token');
    }

    const expectedSignature = this.sign(encodedPayload);
    const expectedBuffer = Buffer.from(expectedSignature);
    const actualBuffer = Buffer.from(signature);
    if (expectedBuffer.length !== actualBuffer.length || !timingSafeEqual(expectedBuffer, actualBuffer)) {
      throw new UnauthorizedException('Invalid admin token');
    }

    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as AdminTokenPayload;
    if (!payload?.sub || !payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
      throw new UnauthorizedException('Expired admin token');
    }

    return payload;
  }

  private sign(value: string) {
    return base64UrlEncode(createHmac('sha256', this.tokenSecret).update(value).digest());
  }

  private get tokenSecret() {
    return process.env.ADMIN_AUTH_SECRET || process.env.JWT_SECRET || 'school-ar-navigation-demo-admin-secret';
  }

  private toAdminDto(admin: any) {
    return {
      id: admin.id,
      username: admin.username,
      displayName: admin.displayName,
      role: admin.role,
    };
  }
}

function base64UrlEncode(value: string | Buffer) {
  return Buffer.from(value)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function base64UrlDecode(value: string) {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  return Buffer.from(padded, 'base64').toString('utf8');
}
