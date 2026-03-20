#!/usr/bin/env node

const { InteractiveChat, ConfigManager } = require('../index');

const main = async () => {
  const config = ConfigManager.load();

  // Update chat settings without resetting model
  config.chat.maxHistory = 20;
  config.memory = {
    path: `${process.env.HOME}/.claude/projects/-srv-aiox/memory`,
    enabled: true,
  };
  ConfigManager.save(config);

  const chat = new InteractiveChat();
  await chat.start();
};

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
