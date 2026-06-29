// API: POST /api/provision
// Returns per-service env vars with example placeholder values

const { execFile } = require('child_process');
const fs = require('fs');
const path = require('path');

const DEMO_MODE = !fs.existsSync(path.join(process.cwd(), 'bin/stripe'));

function generateDemoEnv(providerId) {
  const [provider, service] = providerId.split('/');
  const key = `${provider}_${service}`.replace(/[-.]/g,'_');

  // Each service shows correct env var names with example placeholder values
  const templates = {
    neon_postgres:          `DATABASE_URL=postgresql://user:Example_Password@ep-example.us-east-2.aws.neon.tech/Example_DB?sslmode=require`,
    supabase_project:       `SUPABASE_URL=https://example-project.supabase.co\nSUPABASE_ANON_KEY=eyJhbGciOi...Example_Key\nSUPABASE_SERVICE_KEY=eyJhbGciOi...Example_Service_Key`,
    turso_database:         `TURSO_DATABASE_URL=libsql://example-db.turso.io\nTURSO_AUTH_TOKEN=Example_Token`,
    planetscale_mysql:      `DATABASE_URL=mysql://user:Example_Password@aws.connect.psdb.cloud/Example_DB?sslmode=require`,
    planetscale_postgresql: `DATABASE_URL=postgresql://user:Example_Password@aws.connect.psdb.cloud/Example_DB`,
    prisma_database:        `DATABASE_URL=prisma+postgres://accelerate.prisma-data.net/Example_DB?api_key=Example_API_Key`,
    clickhouse_postgres:    `CLICKHOUSE_URL=https://example.us-east-1.aws.clickhouse.cloud:8443\nCLICKHOUSE_PASSWORD=Example_Password`,
    railway_postgres:       `DATABASE_URL=postgresql://postgres:Example_Password@example.railway.app:5432/railway`,
    railway_mongo:          `MONGODB_URL=mongodb://mongo:Example_Password@example.railway.app:27017/Example_DB`,
    railway_redis:          `REDIS_URL=redis://default:Example_Password@example.railway.app:6379`,
    railway_hosting:        `RAILWAY_SERVICE_ID=Example_Service_ID\nRAILWAY_TOKEN=Example_Token`,
    railway_bucket:         `S3_ENDPOINT=https://example.s3.railway.app\nS3_ACCESS_KEY=Example_Access_Key\nS3_SECRET_KEY=Example_Secret_Key\nS3_BUCKET=Example_Bucket`,
    render_postgres:        `DATABASE_URL=postgresql://user:Example_Password@dpg-example.oregon-postgres.render.com/Example_DB`,
    render_static_site:     `RENDER_SERVICE_ID=srv-Example_ID\nRENDER_API_KEY=rnd_Example_Key`,
    render_web_service:     `RENDER_SERVICE_ID=srv-Example_ID\nRENDER_API_KEY=rnd_Example_Key`,
    flyio_mpg:              `DATABASE_URL=postgresql://postgres:Example_Password@example.fly.dev:5432/Example_DB`,
    upstash_redis:          `UPSTASH_REDIS_URL=redis://default:Example_Password@example.upstash.io:6379\nUPSTASH_REDIS_TOKEN=Example_Token`,
    upstash_vector:         `UPSTASH_VECTOR_URL=https://example-us1.upstash.io\nUPSTASH_VECTOR_TOKEN=Example_Token`,
    upstash_qstash:         `QSTASH_URL=https://qstash.upstash.io/v2\nQSTASH_TOKEN=Example_Token`,
    upstash_search:         `UPSTASH_SEARCH_URL=https://example.upstash.io\nUPSTASH_SEARCH_TOKEN=Example_Token`,
    cloudflare_workers:     `CLOUDFLARE_API_TOKEN=Example_Token\nCLOUDFLARE_ACCOUNT_ID=Example_Account_ID`,
    cloudflare_d1:          `CLOUDFLARE_D1_DATABASE_ID=Example_DB_ID\nCLOUDFLARE_D1_NAME=example-db\nCLOUDFLARE_API_TOKEN=Example_Token`,
    cloudflare_kv:          `CLOUDFLARE_KV_NAMESPACE_ID=Example_Namespace_ID`,
    cloudflare_queues:      `CLOUDFLARE_QUEUE_ID=Example_Queue_ID`,
    cloudflare_workers_ai:  `CLOUDFLARE_AI_GATEWAY=https://gateway.ai.cloudflare.com/v1/Example_Gateway_ID`,
    cloudflare_browser_run: `BROWSER_RENDERING_URL=https://browser-rendering.example.workers.dev`,
    cloudflare_hyperdrive:  `CLOUDFLARE_HYPERDRIVE_ID=Example_Hyperdrive_ID`,
    clerk_auth:             `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_Example_Key\nCLERK_SECRET_KEY=sk_test_Example_Secret`,
    auth0_client:           `AUTH0_CLIENT_ID=Example_Client_ID\nAUTH0_CLIENT_SECRET=Example_Client_Secret\nAUTH0_DOMAIN=example.auth0.com`,
    privy_app:              `PRIVY_APP_ID=cmExample_App_ID\nPRIVY_APP_SECRET=Example_App_Secret`,
    workos_auth:            `WORKOS_API_KEY=sk_test_Example_Key\nWORKOS_CLIENT_ID=client_Example_ID`,
    openrouter_api:         `OPENROUTER_API_KEY=sk-or-v1-Example_Key\nOPENROUTER_BASE_URL=https://openrouter.ai/api/v1`,
    elevenlabs_tts:         `ELEVENLABS_API_KEY=Example_Key`,
    exa_api:                `EXA_API_KEY=Example_Key`,
    firecrawl_api:          `FIRECRAWL_API_KEY=fc-Example_Key`,
    algolia_application:    `ALGOLIA_APP_ID=Example_App_ID\nALGOLIA_API_KEY=Example_API_Key\nALGOLIA_INDEX_NAME=Example_Index`,
    supermemory_memory:     `SUPERMEMORY_API_KEY=sm_Example_Key\nSUPERMEMORY_PROJECT_ID=proj_Example_ID`,
    huggingface_platform:   `HF_TOKEN=hf_Example_Token`,
    huggingface_bucket:     `HF_BUCKET_URL=https://huggingface.co/datasets/example/data\nHF_TOKEN=hf_Example_Token`,
    kernel_project:         `KERNEL_API_KEY=kp_Example_Key\nKERNEL_PROJECT_ID=proj_Example_ID`,
    blaxel_sandbox:         `BLAXEL_SANDBOX_ID=sb_Example_ID\nBLAXEL_API_KEY=bx_Example_Key`,
    blaxel_agent_drive:     `BLAXEL_DRIVE_ID=drive_Example_ID\nBLAXEL_API_KEY=bx_Example_Key`,
    base44_projects_app:    `BASE44_APP_ID=app_Example_ID\nBASE44_API_KEY=b44_Example_Key`,
    posthog_analytics:      `NEXT_PUBLIC_POSTHOG_KEY=phc_Example_Key\nPOSTHOG_HOST=https://us.i.posthog.com`,
    amplitude_analytics:    `AMPLITUDE_API_KEY=Example_Key\nAMPLITUDE_SECRET_KEY=Example_Secret`,
    mixpanel_analytics:     `MIXPANEL_TOKEN=Example_Token\nMIXPANEL_API_SECRET=Example_Secret`,
    vercel_project:         `VERCEL_TOKEN=vc_Example_Token\nVERCEL_PROJECT_ID=prj_Example_ID\nVERCEL_TEAM_ID=team_Example_ID`,
    netlify_project:        `NETLIFY_AUTH_TOKEN=nfp_Example_Token\nNETLIFY_SITE_ID=Example_Site_ID`,
    gitlab_project:         `GITLAB_TOKEN=glpat-Example_Token\nGITLAB_PROJECT_ID=Example_Project_ID`,
    wordpress_com_site:     `WORDPRESS_SITE_URL=https://example.wordpress.com\nWORDPRESS_API_KEY=Example_Key`,
    sentry_project:         `SENTRY_DSN=https://Example_Key@oExample.ingest.us.sentry.io/Example_ID`,
    browserbase_project:    `BROWSERBASE_API_KEY=bb_Example_Key\nBROWSERBASE_PROJECT_ID=Example_Project_ID`,
    inngest_app:            `INNGEST_EVENT_KEY=key_Example_Key\nINNGEST_SIGNING_KEY=sig_Example_Key`,
    agentmail_api:          `AGENTMAIL_API_KEY=am_Example_Key`,
    postalform_mail:        `POSTALFORM_API_KEY=pf_Example_Key`,
    metronome_sandbox:      `METRONOME_API_KEY=mt_Example_Key\nMETRONOME_SANDBOX_ID=sb_Example_ID`,
    wix_headless:           `WIX_API_KEY=Example_Key\nWIX_SITE_ID=Example_Site_ID\nWIX_ACCOUNT_ID=Example_Account_ID`,
  };

  return templates[key] || `${provider.toUpperCase()}_API_KEY=Example_Key\n${provider.toUpperCase()}_PROJECT_ID=Example_Project_ID`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });

  const { providers } = req.body;
  if (!Array.isArray(providers) || providers.length === 0) {
    return res.status(400).json({ error: 'Select at least one service.' });
  }

  const results = [], errors = [], service_envs = {};
  let envContent = '';

  for (const provider of providers) {
    try {
      if (!DEMO_MODE) {
        await new Promise((resolve, reject) => {
          execFile(path.join(process.cwd(), 'bin/stripe'), ['projects', 'add', provider, '--yes'], {
            cwd: process.cwd(), timeout: 30000,
          }, (err, stdout) => {
            if (err && !stdout) return reject(new Error(stderr || err.message));
            resolve(stdout);
          });
        });
      } else {
        await new Promise(r => setTimeout(r, 200 + Math.random() * 300));
        const env = generateDemoEnv(provider);
        service_envs[provider] = env;
        envContent += (envContent ? '\n' : '') + `# ${provider}\n${env}`;
      }
      results.push({ provider, name: provider.split('/')[1], success: true, demo: DEMO_MODE });
    } catch (err) {
      errors.push({ provider, error: err.message.slice(0, 200) });
    }
  }

  return res.status(200).json({
    success: errors.length === 0,
    provisioned: results, errors,
    service_envs, env: envContent,
    mode: DEMO_MODE ? 'demo' : 'live',
    message: DEMO_MODE
      ? `🎭 Demo: ${results.length} service(s) simulated.`
      : `${results.length} service(s) provisioned!`,
  });
}
