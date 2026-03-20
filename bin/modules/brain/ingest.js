const { request } = require('./http-client');
const ora = require('ora');
const cliProgress = require('cli-progress');

async function ingest(options) {
  const { youtube, pdf, doc, image, clone, last, dryRun } = options;

  if (!clone) {
    console.error('Error: --clone <slug> is required');
    process.exit(1);
  }

  let sourceType, sourcePath, sourceUrl, lastN;

  if (youtube) {
    sourceType = 'youtube';
    sourceUrl = youtube;
    lastN = last || undefined;
  } else if (pdf) {
    sourceType = 'pdf';
    sourcePath = pdf;
  } else if (doc) {
    sourceType = 'doc';
    sourcePath = doc;
  } else if (image) {
    sourceType = 'image';
    sourcePath = image;
  } else {
    console.error('Error: Provide --youtube, --pdf, --doc, or --image');
    process.exit(1);
  }

  if (dryRun) {
    console.log('DRY RUN:');
    console.log(`  Source Type: ${sourceType}`);
    console.log(`  Clone: ${clone}`);
    console.log(`  ${sourceType === 'youtube' ? 'URL' : 'Path'}: ${sourceUrl || sourcePath}`);
    if (lastN) console.log(`  Limit: Last ${lastN} videos`);
    return;
  }

  const spinner = ora('Starting ingestion...').start();

  try {
    // Kick off job
    const { data: jobRes } = await request('POST', '/brain/ingest', {
      slug: clone,
      source_type: sourceType,
      source_path: sourcePath,
      source_url: sourceUrl,
      last_n: lastN,
    });

    if (!jobRes.job_id) {
      spinner.fail('Failed to start ingestion job');
      process.exit(1);
    }

    const jobId = jobRes.job_id;
    spinner.succeed(`Job started: ${jobId}`);

    // Poll job status
    const bar = new cliProgress.SingleBar(
      { format: 'Ingestion Progress |{bar}| {percentage}% | {value}/{total} chunks' },
      cliProgress.Presets.shades_classic,
    );

    bar.start(100, 0);
    let done = false;

    while (!done) {
      await new Promise((r) => setTimeout(r, 500));

      const { data: status } = await request('GET', `/brain/job/${jobId}/status`);

      if (status.status === 'done') {
        bar.update(100);
        bar.stop();
        console.log(`✅ Ingestion complete: ${status.chunks} chunks stored`);
        done = true;
      } else if (status.status === 'error') {
        bar.stop();
        console.error(`❌ Job failed: ${status.error}`);
        process.exit(1);
      } else {
        bar.update(Math.min(50, status.chunks || 0));
      }
    }
  } catch (error) {
    spinner.fail(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { ingest };
