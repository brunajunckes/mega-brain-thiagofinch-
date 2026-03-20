const { request } = require('./http-client');

async function status(options) {
  const { json } = options;

  try {
    const { data } = await request('GET', '/brain/clones');

    if (json) {
      console.log(JSON.stringify(data, null, 2));
    } else {
      if (data.clones.length === 0) {
        console.log('No clones found');
        return;
      }

      console.log(`Found ${data.total} clone(s):\n`);
      data.clones.forEach((clone) => {
        console.log(`  ${clone.slug}: ${clone.points_count} chunks`);
      });
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

module.exports = { status };
