import {Inject, Injectable, NotFoundException} from '@nestjs/common';
import {eq} from 'drizzle-orm';
import {DRIZZLE_DB} from 'src/db/db.module';
import {qrEntries} from 'src/db/schema';

@Injectable()
export class QrService {
  constructor(@Inject(DRIZZLE_DB) private readonly db: any) {}

  async getByCode(qrCodeValue: string) {
    const [entry] = await this.db
      .select()
      .from(qrEntries)
      .where(eq(qrEntries.qrCodeValue, qrCodeValue))
      .limit(1);

    if (!entry) {
      throw new NotFoundException('QR entry not found');
    }

    return entry;
  }
}
