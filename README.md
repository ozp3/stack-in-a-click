# Stack-in-a-Click

> **Hermes Agent Accelerated Business Hackathon 2026**
> NVIDIA × Stripe × Nous Research

Tek tıkla SaaS altyapını kur. Servisleri seç, Hermes Agent + Stripe Projects arka planda provision etsin, `.env` olarak teslim al.

## Nasıl Çalışır?

1. İhtiyacın olan servisleri seç (PostgreSQL, Redis, SMS, Auth, Hosting...)
2. "Provision" butonuna tıkla
3. Hermes Agent, Stripe Projects üzerinden tüm servisleri kurar
4. `.env` dosyan hazır!

## Mimarisi

```
Kullanıcı → [Vercel Frontend] → [Serverless API] → [Stripe Projects CLI]
                                      ↑
                              [Hermes Agent]
                           (orchestrate eder, izler)
```

## Teknolojiler

- **Hermes Agent**: Otonom AI ajan, tüm provisioning sürecini yönetir
- **Stripe Projects**: SaaS servislerini tek komutla provision eder
- **Stripe Link CLI**: Gerektiğinde ödeme yapabilir
- **Vercel**: Serverless deployment (frontend + API)
- **NVIDIA NemoClaw**: Agent güvenliği (opsiyonel)

## Servisler

| Servis | Tier | Açıklama |
|--------|------|----------|
| 🐘 Neon PostgreSQL | Ücretsiz | Serverless Postgres |
| ⚡ Upstash Redis | Ücretsiz | Serverless Redis |
| ⚡ Supabase | Ücretsiz | Postgres + Auth + Storage |
| ▲ Vercel Hosting | Ücretsiz | Frontend deployment |
| 🔐 Clerk Auth | Ücretsiz | User authentication |
| 💬 Twilio SMS | Kullandıkça | Programmable SMS |
| 🏖️ Runloop Sandbox | Kullandıkça | Cloud dev sandbox |

## Demo

Demo modda tüm provisioning simüle edilir. Gerçek kullanımda Stripe CLI ile doğrudan provision edilir.

[Live Demo](https://stack-in-a-click.vercel.app)

## Kurulum

```bash
git clone https://github.com/ozp3/stack-in-a-click
cd stack-in-a-click
npm install
```

### Stripe CLI (gerçek kullanım için)

```bash
# Stripe CLI
curl -sSL https://github.com/stripe/stripe-cli/releases/latest/download/stripe_linux_amd64.deb -o stripe.deb
dpkg-deb -x stripe.deb stripe-extract/
cp stripe-extract/usr/bin/stripe ./bin/stripe

# Stripe Projects plugin
export PATH="$PWD/bin:$PATH"
stripe plugin install projects
stripe projects init
```

## Hackathon

**Hermes Agent Accelerated Business Hackathon**
- Düzenleyen: NVIDIA × Stripe × Nous Research
- Son teslim: 30 Haziran 2026
- Kriterler: Fayda, uygulanabilirlik, sunum
