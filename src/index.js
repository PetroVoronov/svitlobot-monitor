const {Api, TelegramClient} = require('telegram');
const {Api: GrammyApi} = require('grammy');
const {StringSession, StoreSession} = require('telegram/sessions');
const readline = require('node:readline/promises');
const {stdin: input, stdout: output, exit} = require('node:process');
const stringify = require('json-stringify-safe');
const {LocalStorage} = require('node-localstorage');
const yargs = require('yargs');
const {Cache} = require('./modules/cache/Cache');
const {securedLogger: log} = require('./modules/logging/logging');
const {name: scriptName, version: scriptVersion} = require('./version');
const i18n = require('./modules/i18n/i18n.config');
const axios = require('axios');
const fs = require('node:fs');

let tendencyDetectNewPeriod = 5;
let tendencyDetectNewStableInterval = 3;
let tendencyDetectNewDelta = 3;

const options = yargs
  .usage('Usage: $0 [options]')
  .option('as-user', {
    describe: 'Start as user instance (bot instance by default)',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('g', {
    alias: 'group',
    describe: 'DTEK group id',
    type: 'number',
    default: 1,
    demandOption: false,
  })
  .option('s', {
    alias: 'step-interval-pair',
    describe: 'Value step in percentage and time interval in minutes, to detect the tendency. Format is "percentage:time"',
    type: 'array',
    default: ['5:1'],
    demandOption: false,
  })
  .option('max', {
    alias: 'max-percentage-to-react-down',
    describe: 'Value in percentage, to react on decrease of percentage',
    type: 'number',
    default: 80,
    demandOption: false,
  })
  .option('tendency-detect-new', {
    describe: 'Detect the tendency by new algorithm',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('tendency-detect-period', {
    describe: 'Count of measures to detect the tendency',
    type: 'number',
    default: 5,
    demandOption: false,
  })
  .option('tendency-detect-stable-interval', {
    describe: 'Count of measures to detect the stable tendency. Should be less than "tendency-detect-period"',
    type: 'number',
    default: 3,
    demandOption: false,
  })
  .option('tendency-detect-delta', {
    describe: 'Delta between the measures to detect the tendency. In percentage, to react on decrease of percentage',
    type: 'number',
    default: 3,
    demandOption: false,
  })
  .option('min', {
    alias: 'min-percentage-to-react-up',
    describe: 'Value in percentage, to react on increase of percentage',
    type: 'number',
    default: 30,
    demandOption: false,
  })
  .option('period-of-fixed-tendency', {
    describe: 'Period in minutes, when the tendency is usually not changed on opposite',
    type: 'number',
    default: 60,
    demandOption: false,
  })
  .option('r', {
    alias: 'refresh-interval',
    describe: 'Refresh interval in minutes, to get the data',
    type: 'number',
    default: 1,
    demandOption: false,
  })
  .option('without-telegram', {
    describe: 'Start without Telegram client',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('l', {
    alias: 'language',
    describe: 'Language code for i18n',
    type: 'string',
    default: 'en',
    demandOption: false,
  })
  .option('p', {
    alias: 'pin-message',
    describe: 'Unpin message from chat',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('u', {
    alias: 'unpin-previous',
    describe: 'Pin message to chat',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('t', {
    alias: 'add-timestamp',
    describe: 'Add timestamp to message',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('tz', {
    alias: 'time-zone',
    describe: 'Time zone for timestamp',
    type: 'string',
    default: process.env.TZ || '',
    demandOption: false,
  })
  .option('n', {
    alias: 'night-time',
    describe: 'Interval in hours, when the script is sending messages in silent mode. Format is "start:stop" in 24h format',
    type: 'string',
    default: '',
    demandOption: false,
  })
  .option('d', {
    alias: 'debug',
    describe: 'Debug level of logging',
    type: 'boolean',
    default: false,
    demandOption: false,
  })
  .option('w', {
    alias: 'wrong-groups',
    describe: 'File with wrong groups',
    type: 'string',
    default: '',
    demandOption: false,
  })
  .version(scriptVersion)
  .help('h')
  .alias('h', 'help')
  .epilog(`${scriptName} v${scriptVersion}`).argv;

if (options.debug) {
  log.setLevel('debug');
}

let tendencyDetectNewModeOn =
  options.tendencyDetectNew ||
  options.tendencyDetectPeriod !== tendencyDetectNewPeriod ||
  options.tendencyDetectStableInterval !== tendencyDetectNewStableInterval ||
  options.tendencyDetectDelta !== tendencyDetectNewDelta;

if (tendencyDetectNewModeOn) {
  tendencyDetectNewPeriod = options.tendencyDetectPeriod;
  tendencyDetectNewStableInterval = options.tendencyDetectStableInterval;
  tendencyDetectNewDelta = options.tendencyDetectDelta;
}

log.appendMaskWord('apiId', 'apiHash', 'phone');

log.info(`Starting ${scriptName} v${scriptVersion}`);

i18n.setLocale(options.language);

const storage = new LocalStorage('data/storage');
const cache = new Cache({
  getItem: (key) => storage.getItem(key),
  setItem: (key, value) => storage.setItem(key, value),
  removeItem: (key) => storage.removeItem(key),
});

let telegramClient = null;

const botAuthTokenMinimumLength = 43;

if (typeof process.env.TELEGRAM_CHAT_ID === 'string' && process.env.TELEGRAM_CHAT_ID.length > 0) {
  cache.setItem('telegramChatId', parseInt(process.env.TELEGRAM_CHAT_ID));
}
if (typeof process.env.TELEGRAM_TOPIC_ID === 'string' && process.env.TELEGRAM_TOPIC_ID.length > 0) {
  cache.setItem('telegramTopicId', parseInt(process.env.TELEGRAM_TOPIC_ID));
}
let telegramChatId = cache.getItem('telegramChatId', 'number');
let telegramTopicId = cache.getItem('telegramTopicId', 'number');

let targetEntity = null;
let targetTitle = '';

const parseMode = 'html';

const svitloBotAPI = 'https://api.svitlobot.in.ua/website/getChannelsForMap';
const refreshInterval = options.refreshInterval * 60 * 1000;

const cityId = 'Київ ->';
const groupId = `${cityId} Група ${options.group}`;

let stepIntervalPairs = [];
let intervalMax = options.refreshInterval;

const statsBuffer = [];
let statsBufferMaxLength = 10;

let wrongGroups = [];

const tendencyPeriod = options.periodOfFixedTendency * 60 * 1000;
const tendencyOn = 'on';
const tendencyOff = 'off';
let tendency = '';
let tendencyTime = new Date();

// eslint-disable-next-line sonarjs/concise-regex
const nightTimeRegexp = /^([01]?[0-9]|2[0-3]):([01]?[0-9]|2[0-3])$/;
const nightTimeInterval = [];

if (Array.isArray(options.stepIntervalPair) && options.stepIntervalPair.length > 0) {
  stepIntervalPairs = options.stepIntervalPair
    .map((pair) => {
      const items = pair.split(':');
      if (items.length === 2) {
        const valueDelta = parseInt(items[0]),
          timeInterval = parseInt(items[1]);
        if (timeInterval > intervalMax) {
          intervalMax = timeInterval;
        }
        return {valueDelta, timeInterval: timeInterval * 60 * 1000};
      } else {
        return null;
      }
    })
    .filter((item) => item !== null)
    .sort((a, b) => a.timeInterval - b.timeInterval);
}
statsBufferMaxLength = intervalMax / options.refreshInterval;
if (typeof options.nightTime === 'string' && options.nightTime.length > 0) {
  const intervalMatch = options.nightTime.match(nightTimeRegexp);
  if (intervalMatch !== null) {
    nightTimeInterval.push(parseInt(intervalMatch[1]), parseInt(intervalMatch[2]));
  }
}

log.info(`As user: ${options.asUser}`);
log.info(`Group ID: ${options.group}`);
log.info(`Refresh interval: ${options.refreshInterval} minutes`);
if (tendencyDetectNewModeOn) {
  log.info(`Tendency detect new mode is enabled`);
  log.info(`Tendency detect period: ${options.tendencyDetectPeriod}`);
  log.info(`Tendency detect stable interval: ${options.tendencyDetectStableInterval}`);
  log.info(`Tendency detect delta: ${options.tendencyDetectDelta}`);
}
{
  log.info(`Tendency detect step interval mode is enabled`);
  log.info('Step interval pairs: ' + stringify(stepIntervalPairs.map((pair) => `${pair.valueDelta}% : ${pair.timeInterval / 60000} min.`)));
}
log.info(`Period of fixed tendency: ${options.periodOfFixedTendency} minutes`);
log.info(`Max percentage to react down: ${options.maxPercentageToReactDown}%`);
log.info(`Min percentage to react up: ${options.minPercentageToReactUp}%`);
log.info(`Language: ${options.language}`);
log.info(`Pin message: ${options.pinMessage}`);
log.info(`Unpin previous: ${options.unpinPrevious}`);
log.info(`Add timestamp: ${options.addTimestamp}`);
log.info(`Time zone: ${options.timeZone}`);
log.info(`Night time interval: ${nightTimeInterval.length === 2 ? options.nightTime : 'not set'}`);

function getAPIAttributes() {
  return new Promise((resolve, reject) => {
    const apiId = cache.getItem('telegramApiId', 'number');
    const apiHash = cache.getItem('telegramApiHash', 'string');
    if (typeof apiId !== 'number' || apiId <= 0 || typeof apiHash !== 'string' || apiHash.length < 1) {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your API ID: ')
        .then((id) => {
          const newApiId = parseInt(id);
          cache.setItem('telegramApiId', newApiId);
          rl.question('Enter your API Hash: ')
            .then((hash) => {
              cache.setItem('telegramApiHash', hash);
              rl.close();
              resolve({apiID: newApiId, hash});
            })
            .catch((error) => {
              log.error(`Error: ${error}`);
              rl.close();
              reject(error);
            });
        })
        .catch((error) => {
          log.error(`Error: ${error}`);
          rl.close();
          reject(error);
        });
    } else {
      resolve({apiId, apiHash});
    }
  });
}

function getBotAuthToken() {
  return new Promise((resolve, reject) => {
    const botAuthToken = cache.getItem('telegramBotAuthToken');
    if (typeof botAuthToken !== 'string' || botAuthToken.length < botAuthTokenMinimumLength) {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your Bot Auth Token: ')
        .then((token) => {
          cache.setItem('telegramBotAuthToken', token);
          rl.close();
          resolve(token);
        })
        .catch((error) => {
          log.error(`Error: ${error}`);
          rl.close();
          reject(error);
        });
    } else {
      resolve(botAuthToken);
    }
  });
}

function getMessageTargetIds() {
  return new Promise((resolve, reject) => {
    if (typeof telegramChatId !== 'number' || telegramChatId === 0 || typeof telegramTopicId !== 'number') {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your chat ID: ')
        .then((id) => {
          telegramChatId = parseInt(id);
          cache.setItem('telegramChatId', telegramChatId);
          rl.question('Enter your topic ID(0 - if no topics): ')
            .then((id) => {
              telegramTopicId = parseInt(id);
              cache.setItem('telegramTopicId', id);
              rl.close();
              resolve();
            })
            .catch((error) => {
              log.error(`Error: ${error}`);
              rl.close();
              reject(error);
            });
        })
        .catch((error) => {
          log.error(`Error: ${error}`);
          rl.close();
          reject(error);
        });
    } else {
      resolve();
    }
  });
}

function getTelegramClient() {
  return new Promise((resolve, reject) => {
    if (options.asUser === true) {
      telegramUserSessionMigrate();
      const storeSession = new StoreSession(`data/session`);
      if (typeof process.env.TELEGRAM_API_ID === 'string' && process.env.TELEGRAM_API_ID.length > 0) {
        cache.setItem('telegramApiId', parseInt(process.env.TELEGRAM_API_ID));
      }
      if (typeof process.env.TELEGRAM_API_HASH === 'string' && process.env.TELEGRAM_API_HASH.length > 0) {
        cache.setItem('telegramApiHash', process.env.TELEGRAM_API_HASH);
      }
      getAPIAttributes()
        .then(({apiId, apiHash}) => {
          const client = new TelegramClient(storeSession, apiId, apiHash, {
            connectionRetries: 5,
            useWSS: true,
            connectionTimeout: 10000,
            appVersion: `${scriptName} v${scriptVersion}`,
          });
          const rl = readline.createInterface({
            input,
            output,
          });
          client
            .start({
              phoneNumber: async () => {
                return rl.question('Enter your phone number: ');
              },
              phoneCode: async () => {
                return rl.question('Enter the code sent to your phone: ');
              },
              password: async () => {
                return rl.question('Enter your password: ');
              },
              onError: (error) => {
                log.error(`Telegram client error: ${error}`);
              },
            })
            .then(() => {
              rl.close();
              log.debug('Telegram client is connected');
              client.setParseMode(parseMode);
              resolve(client);
            })
            .catch((error) => {
              rl.close();
              log.error(`Telegram client connection error: ${error}`);
              reject(error);
            });
        })
        .catch((error) => {
          log.error(`API attributes error: ${error}!`);
          reject(error);
        });
    } else {
      if (
        typeof process.env.TELEGRAM_BOT_AUTH_TOKEN === 'string' &&
        process.env.TELEGRAM_BOT_AUTH_TOKEN.length >= botAuthTokenMinimumLength
      ) {
        cache.setItem('telegramBotAuthToken', process.env.TELEGRAM_BOT_AUTH_TOKEN);
      }
      getBotAuthToken()
        .then((token) => {
          const client = new GrammyApi(token);
          resolve(client);
        })
        .catch((error) => {
          log.error(`Bot Auth Token error: ${error}`);
          reject(error);
        });
    }
  });
}

function telegramUserSessionMigrate() {
  let oldSessionsExists = false;
  try {
    if (fs.statSync('data/session/user').isDirectory() === true) {
      oldSessionsExists = true;
      fs.readdirSync('data/session/user').forEach((file) => {
        const newFile = file.replace('%2F' + 'user', '');
        log.debug(`Migrating user session file: user/${file} to ${newFile}`);
        fs.renameSync(`data/session/user/${file}`, `data/session/${newFile}`);
      });
      log.debug('Old user session migrated successfully.');
      fs.rmdirSync('data/session/user');
    } else {
      log.debug('Old user session not found. Nothing to migrate.');
    }
  } catch (error) {
    if (error.syscall === 'stat' && error.code === 'ENOENT' && error.path === 'data/session/user') {
      log.debug('User session not found. Nothing to migrate.');
    } else {
      log.error(`Error migrating user session: ${error}`);
      gracefulExit();
    }
  }
  if (oldSessionsExists) {
    try {
      if (fs.statSync('data/session/bot').isDirectory() === true) {
        fs.rmSync('data/session/bot', {recursive: true, force: true});
      }
    } catch (error) {
      if (!(error.syscall === 'stat' && error.code === 'ENOENT' && error.path === 'data/session/bot')) {
        log.debug(`Error removing bot session: ${error}`);
      }
    }
  }
}

function getTelegramTargetEntity() {
  return new Promise((resolve, reject) => {
    if (options.asUser === false) {
      telegramClient
        .getChat(telegramChatId)
        .then((entity) => {
          targetTitle = entity.title || `${entity.first_name || ''} ${entity.last_name || ''} (${entity.username || ''})`;
          log.debug(`Telegram chat "${targetTitle}" with ID ${telegramChatId} found!`);
          resolve(entity);
        })
        .catch((error) => {
          log.warn(`Telegram chat with ID ${telegramChatId} not found! Error: ${error}`);
          reject(error);
        });
    } else {
      telegramClient
        .getDialogs()
        .then((dialogs) => {
          let chatId = telegramChatId > 0 ? telegramChatId : -telegramChatId;
          if (chatId > 1000000000000) {
            chatId = chatId - 1000000000000;
          }
          const availableDialogs = dialogs.filter(
              (dialog) => dialog.entity?.migratedTo === undefined || dialog.entity?.migratedTo === null,
            ),
            targetDialog = availableDialogs.find((item) => `${chatId}` === `${item.entity.id}`);
          if (targetDialog !== undefined) {
            targetTitle =
              targetDialog.entity.title ||
              `${targetDialog.entity.firstName || ''} ${targetDialog.entity.lastName || ''} (${targetDialog.entity.username || ''})`;
            if (telegramTopicId > 0) {
              telegramClient
                .invoke(
                  new Api.channels.GetForumTopics({
                    channel: targetDialog.entity,
                    limit: 100,
                    offsetId: 0,
                    offsetDate: 0,
                    addOffset: 0,
                  }),
                )
                .then((response) => {
                  if (Array.isArray(response.topics) && response.topics.length > 0) {
                    // eslint-disable-next-line sonarjs/no-nested-functions
                    const targetTopic = response.topics.find((topic) => topic.id === telegramTopicId);
                    if (targetTopic) {
                      log.debug(`Telegram topic "${targetTopic.title}" in chat "${targetTitle}" with ID ${telegramChatId} found!`);
                      resolve(targetDialog.entity);
                    } else {
                      log.warn(`Topic with id ${telegramTopicId} not found in "${targetTitle}" (${telegramChatId})!`);
                      reject(new Error(`Topic with id ${telegramTopicId} not found in "${targetTitle}" (${telegramChatId})!`));
                    }
                  } else {
                    log.warn(`No topics found in "${targetTitle}" (${telegramChatId})!`);
                    reject(new Error(`No topics found in "${targetTitle}" (${telegramChatId})!`));
                  }
                })
                .catch((error) => {
                  reject(error);
                });
            } else {
              log.debug(`Telegram chat "${targetTitle}" with ID ${telegramChatId} found!`);
              resolve(targetDialog.entity);
            }
          } else {
            reject(new Error(`Telegram chat with ID ${telegramChatId} not found`));
          }
        })
        .catch((error) => {
          reject(error);
        });
    }
  });
}

function telegramSendMessage(target, messages, messageOptions) {
  return new Promise((resolve, reject) => {
    if (telegramClient !== null) {
      telegramClient
        .sendMessage(target, messages, messageOptions)
        .then((message) => {
          resolve(options.asUser === true ? message.id : message.message_id);
        })
        .catch((error) => {
          reject(error);
        });
    } else {
      reject(new Error('Telegram client is not ready!'));
    }
  });
}

function telegramPinMessage(target, messageId) {
  return new Promise((resolve, reject) => {
    if (telegramClient !== null) {
      if (options.asUser === true) {
        telegramClient
          .pinMessage(target, messageId)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        telegramClient
          .pinChatMessage(target, messageId)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      }
    } else {
      reject(new Error('Telegram client is not ready!'));
    }
  });
}

function telegramUnpinMessage(target, messageId) {
  return new Promise((resolve, reject) => {
    if (telegramClient !== null) {
      if (options.asUser === true) {
        telegramClient
          .unpinMessage(target, messageId)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      } else {
        telegramClient
          .unpinChatMessage(target, messageId)
          .then(() => {
            resolve();
          })
          .catch((error) => {
            reject(error);
          });
      }
    } else {
      reject(new Error('Telegram client is not ready!'));
    }
  });
}

function tendencyIsChanged(tendencyNew, percentage, percentageDelta) {
  if (tendencyNew !== '') {
    let startedSwitchingOn = tendencyNew === tendencyOn;
    tendency = tendencyNew;
    tendencyTime = new Date();
    const timeStampOptions = {timeStyle: 'short', dateStyle: 'short'};
    tendencyTime = new Date();
    if (options.timeZone) {
      timeStampOptions.timeZone = options.timeZone;
    }
    const timeStamp = new Date().toLocaleString(options.language, timeStampOptions);
    const messageText =
      (options.addTimestamp ? timeStamp + ': ' : '') +
      i18n.__(
        `Group %s - switching to ${startedSwitchingOn ? 'on' : 'off'} is started. Currently: %s, delta: %s.`,
        groupId,
        `${percentage}%`,
        `${percentageDelta}%`,
      );

    const currentHour = options.timeZone
      ? new Date().toLocaleString(options.language, {timeZone: options.timeZone, hour: 'numeric', hour12: false})
      : new Date().getHours();

    const silentMode =
      nightTimeInterval.length === 2 &&
      ((nightTimeInterval[1] > nightTimeInterval[0] && currentHour >= nightTimeInterval[0] && currentHour < nightTimeInterval[1]) ||
        (nightTimeInterval[1] < nightTimeInterval[0] && (currentHour >= nightTimeInterval[0] || currentHour < nightTimeInterval[1])));

    log.info(`${messageText}`);
    let telegramMessage;
    let telegramTarget;
    let messageOptions;
    if (telegramClient !== null) {
      if (options.asUser === true) {
        telegramMessage = {
          message: messageText,
        };
        if (telegramTopicId > 0) {
          telegramMessage.replyTo = telegramTopicId;
        }
        if (silentMode === true) {
          telegramMessage.silent = true;
        }
        telegramTarget = targetEntity;
      } else {
        telegramMessage = messageText;
        telegramTarget = telegramChatId;
        messageOptions = {
          parse_mode: parseMode,
        };
        if (telegramTopicId > 0) {
          messageOptions.message_thread_id = telegramTopicId;
        }
        if (silentMode === true) {
          messageOptions.disable_notification = true;
        }
      }
      telegramSendMessage(telegramTarget, telegramMessage, messageOptions)
        .then((messageId) => {
          log.debug(`Telegram message sent to "${targetTitle}" with topic ${telegramTopicId}`);
          const previousMessageId = cache.getItem('lastMessageId');
          cache.setItem('lastMessageId', messageId);
          if (options.pinMessage) {
            telegramPinMessage(telegramTarget, messageId)
              .then(() => {
                log.debug(`Telegram message with id: ${messageId} pinned to "${targetTitle}" with topic ${telegramTopicId}`);
                if (options.unpinPrevious) {
                  if (previousMessageId !== undefined && previousMessageId !== null) {
                    telegramUnpinMessage(telegramTarget, previousMessageId)
                      .then(() => {
                        log.debug(
                          `Telegram message with id: ${previousMessageId} unpinned from "${targetTitle}" with topic ${telegramTopicId}`,
                        );
                      })
                      .catch((error) => {
                        log.error(`Telegram message unpin error: ${error}`);
                      });
                  }
                }
              })
              .catch((error) => {
                log.error(`Telegram message pin error: ${error}`);
              });
          }
        })
        .catch((error) => {
          log.error(`Telegram message error: ${error}`);
        });
    }
  }
}

function dataClean(data) {
  if (data.length > 2) {
    const sum = data.reduce((acc, item) => acc + item.timeStamp, 0),
      avg = sum / data.length,
      variance = data.reduce((acc, item) => acc + Math.pow(item.timeStamp - avg, 2), 0) / data.length,
      stdDev = Math.sqrt(variance);
    return data.filter((item) => item.timeStamp >= avg - stdDev && item.timeStamp <= avg + stdDev);
  } else {
    return data;
  }
}

function tendencyFromDelta(delta) {
  if (delta > 0) {
    return tendencyOn;
  } else if (delta < 0) {
    return tendencyOff;
  } else {
    return '';
  }
}

function checkGroupTendency() {
  axios
    .get(svitloBotAPI)
    .then((response) => {
      const data = response.data,
        stats = {
          on: 0,
          off: 0,
          total: 0,
          percentage: 0,
          timeStamp: new Date(),
        };
      if (typeof data === 'string' && data.length > 0) {
        const lines = data.split('\n'),
          groupData = [];
        lines.forEach((line) => {
          const items = line.split(';&&&;');
          if (
            items.length === 12 &&
            items[3].startsWith(cityId) &&
            items[9] === groupId &&
            '12'.includes(items[1]) &&
            wrongGroups.includes(items[3]) === false
          ) {
            groupData.push({
              on: items[1] === '1',
              timeStamp: new Date(items[2]).getTime(),
            });
          }
        });
        const groupDataOn = dataClean(groupData.filter((item) => item.on === true)),
          groupDataOff = dataClean(groupData.filter((item) => item.on === false));
        stats.on = groupDataOn.length;
        stats.off = groupDataOff.length;
        stats.total = stats.on + stats.off;
        stats.percentage = stats.total > 0 ? Math.round((stats.on / stats.total) * 100) : 0;
        if (stats.total !== 0) {
          log.debug(
            `For group ${groupId} - "on" percentage is ${stats.percentage}%, the other statistics are: ${stats.on} "on", ${stats.off} "off", ${stats.total} total`,
          );
          if (tendencyDetectNewModeOn) {
            statsBuffer.push(stats.percentage);
            if (statsBuffer.length > tendencyDetectNewPeriod) {
              statsBuffer.shift();
            }
            if (statsBuffer.length >= tendencyDetectNewStableInterval) {
              let tendencyStableCount = 0;
              let tendencyDelta = 0;
              let tendencyCurrent = '';
              for (let i = 1; i < statsBuffer.length - 2; i++) {
                const tendencyDeltaNext = statsBuffer[i + 1] - statsBuffer[i];
                const tendencyNext = tendencyFromDelta(tendencyDeltaNext);
                if (tendencyCurrent === tendencyNext && tendencyCurrent !== '') {
                  tendencyStableCount++;
                  tendencyDelta += tendencyDeltaNext;
                  if (tendencyStableCount >= tendencyDetectNewStableInterval) {
                    break;
                  }
                } else {
                  tendencyStableCount = 0;
                  tendencyCurrent = tendencyNext;
                  tendencyDelta = 0;
                }
              }
              if (tendencyCurrent === '') {
                tendencyDelta =
                  statsBuffer.reduce((acc, item, index) => {
                    if (index > 0) {
                      return acc + item - statsBuffer[index - 1];
                    } else {
                      return acc;
                    }
                  }, 0) / tendencyStableCount;
                if (Math.abs(tendencyDelta) >= tendencyDetectNewDelta) {
                  tendencyCurrent = tendencyFromDelta(tendencyDelta);
                }
              }
              if (tendencyCurrent !== '' && tendency !== tendencyCurrent) {
                tendencyIsChanged(tendency, stats.percentage, tendencyDelta);
              }
            }
          } else {
            const timeForDateBack = new Date().getTime();
            if (tendency !== '' && new Date(timeForDateBack - tendencyPeriod).getTime() > tendencyTime.getTime()) {
              tendency = '';
            }
            stepIntervalPairs.some((pair) => {
              let result = false;
              const dateBack = new Date(timeForDateBack - pair.timeInterval * 1.01),
                statsToCompare = statsBuffer.find((item) => item.timeStamp.getTime() >= dateBack.getTime());
              if (statsToCompare !== undefined) {
                const percentageDelta = stats.percentage - statsToCompare.percentage,
                  percentageDeltaAbs = Math.abs(percentageDelta);
                if (percentageDeltaAbs >= pair.valueDelta) {
                  if (tendency !== tendencyOn && percentageDelta > 0 && stats.percentage >= options.minPercentageToReactUp) {
                    tendencyIsChanged(tendencyOn, stats.percentage, percentageDeltaAbs);
                  } else if (tendency !== tendencyOff && percentageDelta < 0 && stats.percentage <= options.maxPercentageToReactDown) {
                    tendencyIsChanged(tendencyOff, stats.percentage, percentageDeltaAbs);
                  }
                  result = true;
                }
              }
              return result;
            });
            statsBuffer.push(stats);
            if (statsBuffer.length > statsBufferMaxLength + 1) {
              statsBuffer.shift();
            }
          }
        } else {
          log.warn(`No data found for group ${groupId}!`);
        }
      } else {
        log.warn('No data received from SvitloBot API!');
      }
    })
    .catch((error) => {
      log.error(`Error: ${error}`);
    });
}

function startCheckGroupTendency() {
  checkGroupTendency();
  setInterval(() => {
    checkGroupTendency();
  }, refreshInterval);
}

function readWrongGroups() {
  return new Promise((resolve, reject) => {
    if (options.wrongGroups === '') {
      resolve();
    }
    fs.readFile(options.wrongGroups, 'utf8', (error, data) => {
      if (error) {
        reject(error);
      } else {
        wrongGroups = data.split('\n');
        resolve();
      }
    });
  });
}

function gracefulExit() {
  if (telegramClient !== null && options.asUser === true && telegramClient.connected === true) {
    telegramClient
      .disconnect()
      .then(() => {
        log.info(`Telegram client is disconnected!`);
        telegramClient
          .destroy()
          .then(() => {
            log.info(`Telegram client is destroyed!`);
            telegramClient = null;
            exit(0);
          })
          .catch((error) => {
            log.error(`Telegram client - nothing to destroy!`);
            exit(0);
          });
      })
      .catch((error) => {
        log.error(`Telegram client is not connected!`);
        exit(0);
      });
  } else if (telegramClient !== null && options.user === false) {
    try {
      telegramClient.stop();
      log.info(`Telegram bot is stopped!`);
      // eslint-disable-next-line sonarjs/no-ignored-exceptions
    } catch (error) {
      log.info(`Telegram bot is stopped!`);
    }
    exit(0);
  } else {
    log.info('All clients are disconnected!');
    exit(0);
  }
}

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

readWrongGroups().then(() => {
  if (options.withoutTelegram === true) {
    startCheckGroupTendency();
  } else {
    log.info('Starting Telegram client...');
    getMessageTargetIds()
      .then(() => {
        getTelegramClient()
          .then((client) => {
            log.info('Telegram client is connected. Getting target entity ...');
            telegramClient = client;
            getTelegramTargetEntity()
              .then((entity) => {
                log.info('Telegram target entity is found. ');
                targetEntity = entity;
                startCheckGroupTendency();
              })
              .catch((error) => {
                log.error(`Telegram target peer error: ${error}`);
                gracefulExit();
              });
          })
          .catch((error) => {
            log.error(`Telegram client error: ${error}`);
            gracefulExit();
          });
      })
      .catch((error) => {
        log.error(`Error: ${error}`);
        gracefulExit();
      });
  }
});
