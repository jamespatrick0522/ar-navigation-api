import {Controller, Get, Header, Res} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Response} from 'express';

const APP_PACKAGE_NAME = 'com.pacarnavigation';
const APP_LINK_HOST = 'ar-navigation-api.onrender.com';
const APP_OPEN_URL = 'https://' + APP_LINK_HOST + '/app/open';

@Controller()
export class AppLinksController {
  constructor(private readonly configService: ConfigService) {}

  @Get(['app', 'app/open'])
  @Header('Content-Type', 'text/html; charset=utf-8')
  getInstallPage() {
    const apkUrl = this.getApkUrl();
    const downloadHref = apkUrl || '/app/download';
    const downloadDisabled = apkUrl ? '' : 'aria-disabled="true"';
    const downloadText = apkUrl ? 'Download Android APK' : 'APK link not configured yet';

    return '<!doctype html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="utf-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
      '<title>PAC AR Navigation</title>' +
      '<style>' +
      ':root{color-scheme:dark;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;background:#07111f;color:#f8fafc}' +
      'body{margin:0;min-height:100vh;display:grid;place-items:center;background:linear-gradient(rgba(7,17,31,.30),rgba(7,17,31,.92)),url("https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=1200&q=80") center/cover}' +
      'main{width:min(92vw,480px);padding:28px;border:1px solid rgba(148,163,184,.24);background:rgba(15,23,42,.86);box-shadow:0 24px 80px rgba(0,0,0,.36);backdrop-filter:blur(12px)}' +
      'h1{margin:0 0 10px;font-size:clamp(30px,8vw,44px);line-height:1}' +
      'p{margin:0 0 18px;color:#cbd5e1;line-height:1.55}' +
      'a{display:block;margin-top:12px;padding:15px 16px;color:#06131f;background:#22d3ee;text-align:center;text-decoration:none;font-weight:800}' +
      'a.secondary{color:#e2e8f0;background:rgba(30,41,59,.92)}' +
      'a[aria-disabled="true"]{pointer-events:none;color:#94a3b8;background:rgba(51,65,85,.72)}' +
      'small{display:block;margin-top:18px;color:#94a3b8;line-height:1.45}' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<main>' +
      '<h1>PAC AR Navigation</h1>' +
      '<p>If the app is installed, this QR link can open it directly. If not, download and install the Android APK first.</p>' +
      '<a href="' + APP_OPEN_URL + '">Open App</a>' +
      '<a class="secondary" href="' + downloadHref + '" ' + downloadDisabled + '>' + downloadText + '</a>' +
      '<small>Android may ask for permission to install apps from your browser or file manager. This is normal for APK installs outside Google Play.</small>' +
      '</main>' +
      '</body>' +
      '</html>';
  }

  @Get('app/qr')
  @Header('Content-Type', 'text/html; charset=utf-8')
  getQrPrintPage() {
    const qrImageUrl = 'https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=' + encodeURIComponent(APP_OPEN_URL);

    return '<!doctype html>' +
      '<html lang="en">' +
      '<head>' +
      '<meta charset="utf-8" />' +
      '<meta name="viewport" content="width=device-width, initial-scale=1" />' +
      '<title>PAC AR Navigation QR</title>' +
      '<style>' +
      'body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f8fafc;color:#0f172a;font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}' +
      'main{width:min(92vw,520px);text-align:center;padding:28px}' +
      'h1{margin:0 0 8px;font-size:34px}' +
      'p{margin:0 0 22px;color:#475569;line-height:1.45}' +
      'img{width:min(78vw,420px);height:min(78vw,420px);border:14px solid #fff;box-shadow:0 18px 60px rgba(15,23,42,.18)}' +
      'code{display:block;margin-top:18px;overflow-wrap:anywhere;color:#0f766e;font-weight:700}' +
      '@media print{body{background:#fff}main{padding:0}img{box-shadow:none;border:10px solid #fff}}' +
      '</style>' +
      '</head>' +
      '<body>' +
      '<main>' +
      '<h1>PAC AR Navigation</h1>' +
      '<p>Scan to open the Android app or download the APK.</p>' +
      '<img alt="PAC AR Navigation QR code" src="' + qrImageUrl + '" />' +
      '<code>' + APP_OPEN_URL + '</code>' +
      '</main>' +
      '</body>' +
      '</html>';
  }

  @Get('app/download')
  downloadApk(@Res() response: Response) {
    const apkUrl = this.getApkUrl();
    if (!apkUrl) {
      response
        .status(503)
        .type('text/plain')
        .send('Android APK download URL is not configured. Set ANDROID_APK_URL in Render.');
      return;
    }

    response.redirect(302, apkUrl);
  }

  @Get('.well-known/assetlinks.json')
  @Header('Content-Type', 'application/json; charset=utf-8')
  getAssetLinks() {
    const fingerprints = this.getSha256Fingerprints();
    if (fingerprints.length === 0) {
      return [];
    }

    return [
      {
        relation: ['delegate_permission/common.handle_all_urls'],
        target: {
          namespace: 'android_app',
          package_name: APP_PACKAGE_NAME,
          sha256_cert_fingerprints: fingerprints,
        },
      },
    ];
  }

  private getApkUrl() {
    return this.configService.get<string>('ANDROID_APK_URL')?.trim();
  }

  private getSha256Fingerprints() {
    return (this.configService.get<string>('ANDROID_APP_LINK_SHA256_CERT_FINGERPRINTS') || '')
      .split(',')
      .map(fingerprint => fingerprint.trim())
      .filter(Boolean);
  }
}

