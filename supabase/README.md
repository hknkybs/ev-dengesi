# Ev Dengesi — Supabase kurulumu

## Faz 1 — Backend (hane, oda, görev, tamamlama, davet kodu, gerçek zamanlı senkron)

1. Supabase projenin **Settings → API** sayfasından **Project URL** ve **anon public key**'i al.
2. Proje kökünde `.env` dosyası oluştur (`.env.example`'ı kopyala):
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=xxxxx
   ```
3. Supabase Dashboard → **SQL Editor**'e git, `schema.sql` dosyasının tamamını yapıştırıp çalıştır.
4. Dashboard → **Authentication → Providers**'da **Anonymous Sign-ins**'in açık olduğunu doğrula (varsayılan olarak genelde açık gelir).
5. `npx expo start` ile uygulamayı çalıştır — "Haneyi Oluştur" veya "Haneye Katıl" ile test et.

Bu kadarı yeterli: gerçek çoklu cihaz senkronu, davet kodu ile katılım ve görev ataması bu noktada tam çalışır durumda olacak.

## Faz 2 — Gerçek push bildirimleri (opsiyonel, sonra)

Bunun için ayrıca bir **Expo/EAS hesabı** gerekiyor (push token üretmek projesiz mümkün değil):

1. `eas login` ile EAS hesabına giriş yap, `eas init` ile projeye bir EAS project ID bağla (bu `app.json`'a `expo.extra.eas.projectId` ekler).
2. Supabase CLI kur ve projene bağlan: `supabase login`, `supabase link --project-ref <ref>`.
3. Edge Function'ı deploy et:
   ```
   supabase functions deploy check-due-tasks --no-verify-jwt
   ```
4. Dashboard → **Database → Extensions**'ta `pg_cron` ve `pg_net`'i etkinleştir.
5. SQL Editor'de bir zamanlama kur (her 15 dakikada bir kontrol):
   ```sql
   select cron.schedule(
     'check-due-tasks-every-15-min',
     '*/15 * * * *',
     $$
     select net.http_post(
       url := 'https://<project-ref>.functions.supabase.co/check-due-tasks',
       headers := jsonb_build_object('Authorization', 'Bearer <service_role key>')
     );
     $$
   );
   ```
6. Uygulamada Ayarlar → Bayatlama bildirimleri açıldığında cihaz otomatik olarak push token'ını kaydetmeye çalışır (`registerPushToken`) — EAS project ID kurulu değilse bu sessizce hiçbir şey yapmaz, hata vermez.

Bu aşamadan sonra: bir görev birine atanıp süresi dolduğunda, o kişinin **kendi telefonuna**, uygulama kapalıyken bile gerçek bir push bildirimi düşer.
