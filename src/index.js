const {Api, TelegramClient} = require('telegram');
const {Telegraf} = require('telegraf');
const {StringSession, StoreSession} = require('telegram/sessions');
const readline = require('node:readline/promises');
const {stdin: input, stdout: output, exit} = require('node:process');
const stringify = require('json-stringify-safe');
const {LocalStorage} = require('node-localstorage');
const yargs = require('yargs');
const {Cache} = require('./modules/cache/Cache');
const {logLevelInfo, logLevelDebug, setLogLevel, logDebug, logInfo, logWarning, logError} = require('./modules/logging/logging');
const {name: scriptName, version: scriptVersion} = require('./version');
const i18n = require('./modules/i18n/i18n.config');
const axios = require('axios');
const fs = require('node:fs');

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

const options = yargs
  .usage('Usage: $0 [options]')
  .option('l', {
    alias: 'language',
    describe: 'Language code for i18n',
    type: 'string',
    default: 'en',
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
    demandOption: false,
  })
  .option('max', {
    alias: 'max-percentage-to-react-down',
    describe: 'Value in percentage, to react on decrease of percentage',
    type: 'number',
    default: 80,
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
  .option('n', {
    alias: 'no-telegram',
    describe: 'Start without Telegram client',
    type: 'boolean',
    demandOption: false,
  })
  .option('u', {
    alias: 'as-user',
    describe: 'Start as user instance (bot instance by default)',
    type: 'boolean',
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
  .option('d', {
    alias: 'debug',
    describe: 'Debug level of logging',
    type: 'boolean',
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

setLogLevel(options.debug ? logLevelDebug : logLevelInfo);

i18n.setLocale(options.language);

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
} else {
  stepIntervalPairs.push({valueDelta: 5, timeInterval: options.refreshInterval * 60 * 1000});
}
statsBufferMaxLength = intervalMax / options.refreshInterval;
logInfo(`Group ID: ${options.group}`);
logInfo(`Refresh interval: ${options.refreshInterval} minutes`);
logInfo(`Step interval pairs: ${stringify(stepIntervalPairs)}`);
logInfo(`Period of fixed tendency: ${options.periodOfFixedTendency} minutes`);
logInfo(`Max percentage to react down: ${options.maxPercentageToReactDown}%`);
logInfo(`Min percentage to react up: ${options.minPercentageToReactUp}%`);

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
              logError(`Error: ${error}`);
              rl.close();
              reject(error);
            });
        })
        .catch((error) => {
          logError(`Error: ${error}`);
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
          logError(`Error: ${error}`);
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
    if (telegramChatId === null || telegramTopicId === null) {
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
              logError(`Error: ${error}`);
              rl.close();
              reject(error);
            });
        })
        .catch((error) => {
          logError(`Error: ${error}`);
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
      userSessionMigrate();
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
                logError(`Telegram client error: ${error}`);
              },
            })
            .then(() => {
              rl.close();
              logDebug('Telegram client is connected');
              client.setParseMode(parseMode);
              resolve(client);
            })
            .catch((error) => {
              rl.close();
              logError(`Telegram client connection error: ${error}`);
              reject(error);
            });
        })
        .catch((error) => {
          logError(`API attributes error: ${error}!`);
          reject(error);
        });
    } else {
      if (process.env.TELEGRAM_BOT_AUTH_TOKEN === 'string' && process.env.TELEGRAM_BOT_AUTH_TOKEN.length >= botAuthTokenMinimumLength) {
        cache.setItem('telegramBotAuthToken', process.env.TELEGRAM_BOT_AUTH_TOKEN);
      }
      getBotAuthToken()
        .then((token) => {
          const client = new Telegraf(token);
          resolve(client);
        })
        .catch((error) => {
          logError(`Bot Auth Token error: ${error}`);
          reject(error);
        });
    }
  });
}

function getTelegramTargetEntity() {
  return new Promise((resolve, reject) => {
    if (options.asUser === false) {
      telegramClient.telegram
        .getChat(telegramChatId)
        .then((entity) => {
          targetTitle = entity.title || `${entity.first_name || ''} ${entity.last_name || ''} (${entity.username || ''})`;
          logDebug(`Telegram chat "${targetTitle}" with ID ${telegramChatId} found!`);
          resolve(entity);
        })
        .catch((error) => {
          logWarning(`Telegram chat with ID ${telegramChatId} not found! Error: ${error}`);
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
                      logDebug(`Telegram topic "${targetTopic.title}" in chat "${targetTitle}" with ID ${telegramChatId} found!`);
                      resolve(targetDialog.entity);
                    } else {
                      logWarning(`Topic with id ${telegramTopicId} not found in "${targetTitle}" (${telegramChatId})!`);
                      reject(new Error(`Topic with id ${telegramTopicId} not found in "${targetTitle}" (${telegramChatId})!`));
                    }
                  } else {
                    logWarning(`No topics found in "${targetTitle}" (${telegramChatId})!`);
                    reject(new Error(`No topics found in "${targetTitle}" (${telegramChatId})!`));
                  }
                })
                .catch((error) => {
                  reject(error);
                });
            } else {
              logDebug(`Telegram chat "${targetTitle}" with ID ${telegramChatId} found!`);
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

function gracefulExit() {
  if (telegramClient !== null && options.asUser === true && telegramClient.connected === true) {
    telegramClient
      .disconnect()
      .then(() => {
        logInfo(`Telegram client is disconnected!`);
        telegramClient
          .destroy()
          .then(() => {
            logInfo(`Telegram client is destroyed!`);
            telegramClient = null;
            exit(0);
          })
          .catch((error) => {
            logError(`Telegram client - nothing to destroy!`);
            exit(0);
          });
      })
      .catch((error) => {
        logError(`Telegram client is not connected!`);
        exit(0);
      });
  } else if (telegramClient !== null && options.user === false) {
    try {
      telegramClient.stop();
      logInfo(`Telegram bot is stopped!`);
      // eslint-disable-next-line sonarjs/no-ignored-exceptions
    } catch (error) {
      logInfo(`Telegram bot is stopped!`);
    }
    exit(0);
  } else {
    logInfo('All clients are disconnected!');
    exit(0);
  }
}

function telegramMessageOnChange(startedSwitchingOn) {
  const timeStampOptions = {timeStyle: 'short', dateStyle: 'short'};
  if (options.timeZone) {
    timeStampOptions.timeZone = options.timeZone;
  }
  const timeStamp = new Date().toLocaleString(options.language, timeStampOptions),
    messageText =
      (options.addTimestamp ? timeStamp + ': ' : '') +
      i18n.__(startedSwitchingOn ? 'Group %s - switching to on is started' : 'Group %s - switching to off is started', groupId);

  logInfo(`${messageText}`);
  if (telegramClient !== null) {
    if (options.asUser === true) {
      const telegramMessage = {
        message: messageText,
      };
      if (telegramTopicId > 0) {
        telegramMessage.replyTo = telegramTopicId;
      }
      telegramClient
        .sendMessage(targetEntity, telegramMessage)
        .then((message) => {
          logDebug(`Telegram message sent to "${targetTitle}" with topic ${telegramTopicId}`);
          const previousMessageId = cache.getItem('lastMessageId');
          cache.setItem('lastMessageId', message.message_id);
          if (options.pinMessage) {
            telegramClient
              .pinMessage(targetEntity, message.id)
              .then(() => {
                logDebug(`Telegram message pinned to "${targetTitle}" with topic ${telegramTopicId}`);
                if (options.unpinPrevious) {
                  if (previousMessageId !== undefined) {
                    telegramClient.unpinMessage(targetEntity, previousMessageId).then(() => {
                      logDebug(`Telegram message unpinned from "${targetTitle}" with topic ${telegramTopicId}`);
                    });
                  }
                }
              })
              .catch((error) => {
                logError(`Telegram message pin error: ${error}`);
              });
          }
          cache.setItem('lastMessageId', message.id);
        })
        .catch((error) => {
          logError(`Telegram message error: ${error}`);
        });
    } else {
      const messageOptions = {
        parse_mode: parseMode,
      };
      if (telegramTopicId > 0) {
        messageOptions.message_thread_id = telegramTopicId;
      }
      telegramClient.telegram
        .sendMessage(telegramChatId, messageText, messageOptions)
        .then((message) => {
          logDebug(`Telegram message sent to "${targetTitle}" with topic ${telegramTopicId}`);
          const previousMessageId = cache.getItem('lastMessageId');
          cache.setItem('lastMessageId', message.message_id);
          if (options.pinMessage) {
            telegramClient.telegram
              .pinChatMessage(telegramChatId, message.message_id)
              .then(() => {
                logDebug(`Telegram message pinned to "${targetTitle}" with topic ${telegramTopicId}`);
                if (options.unpinPrevious) {
                  if (previousMessageId !== undefined) {
                    telegramClient.telegram.unpinChatMessage(targetTitle, previousMessageId).then(() => {
                      logDebug(`Telegram message unpinned from "${targetTitle}" with topic ${telegramTopicId}`);
                    });
                  }
                }
              })
              .catch((error) => {
                logError(`Telegram message pin error: ${error}`);
              });
          }
        })
        .catch((error) => {
          logError(`Telegram message error: ${error}`);
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

function checkGroupTendency() {
  axios.get(svitloBotAPI).then((response) => {
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
        logDebug(
          `For group ${groupId} - "on" percentage is ${stats.percentage}%, the other statistics are: ${stats.on} "on", ${stats.off} "off", ${stats.total} total`,
        );
        if (tendency !== '' && new Date(timeForDateBack - tendencyPeriod).getTime() > tendencyTime.getTime()) {
          tendency = '';
        }
        const timeForDateBack = new Date().getTime();
        stepIntervalPairs.some((pair) => {
          let result = false;
          const dateBack = new Date(timeForDateBack - pair.timeInterval * 1.01),
            statsToCompare = statsBuffer.find((item) => item.timeStamp.getTime() >= dateBack.getTime());
          if (statsToCompare !== undefined) {
            const percentageDelta = stats.percentage - statsToCompare.percentage,
              percentageDeltaAbs = Math.abs(percentageDelta);
            if (percentageDeltaAbs >= pair.valueDelta) {
              if (tendency !== tendencyOn && percentageDelta > 0 && stats.percentage >= options.minPercentageToReactUp) {
                tendency = tendencyOn;
                tendencyTime = new Date();
                telegramMessageOnChange(true);
              } else if (tendency !== tendencyOff && percentageDelta < 0 && stats.percentage <= options.maxPercentageToReactDown) {
                tendency = tendencyOff;
                tendencyTime = new Date();
                telegramMessageOnChange(false);
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
      } else {
        logWarning(`No data found for group ${groupId}!`);
      }
    } else {
      logWarning('No data received from SvitloBot API!');
    }
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

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

readWrongGroups().then(() => {
  if (options.noTelegram === true) {
    startCheckGroupTendency();
  } else {
    logInfo('Starting Telegram client...');
    getMessageTargetIds()
      .then(() => {
        getTelegramClient()
          .then((client) => {
            logInfo('Telegram client is connected. Getting target entity ...');
            telegramClient = client;
            getTelegramTargetEntity()
              // eslint-disable-next-line sonarjs/no-nested-functions
              .then((entity) => {
                logInfo('Telegram target entity is found. ');
                targetEntity = entity;
                telegramMessageOnChange(true);
                startCheckGroupTendency();
              })
              // eslint-disable-next-line sonarjs/no-nested-functions
              .catch((error) => {
                logError(`Telegram target peer error: ${error}`);
                gracefulExit();
              });
          })
          .catch((error) => {
            logError(`Telegram client error: ${error}`);
            gracefulExit();
          });
      })
      .catch((error) => {
        logError(`Error: ${error}`);
        gracefulExit();
      });
  }
});

function userSessionMigrate() {
  let oldSessionsExists = false;
  try {
    if (fs.statSync('data/session/user').isDirectory() === true) {
      oldSessionsExists = true;
      fs.readdirSync('data/session/user').forEach((file) => {
        const newFile = file.replace('%2Fuser', '');
        logDebug(`Migrating user session file: user/${file} to ${newFile}`);
        fs.renameSync(`data/session/user/${file}`, `data/session/${newFile}`);
      });
      logDebug('User session migrated successfully.');
      fs.rmdirSync('data/session/user');
    } else {
      logDebug('User session not found. Nothing to migrate.');
    }
  } catch (error) {
    if (error.syscall === 'stat' && error.code === 'ENOENT' && error.path === 'data/session/user') {
      logDebug('User session not found. Nothing to migrate.');
    } else {
      logError(`Error migrating user session: ${error}`);
      gracefulExit();
    }
  }
  if (oldSessionsExists) {
    try {
      if (fs.statSync('data/session/bot').isDirectory() === true) {
        fs.rmdirSync('data/session/bot', {force: true});
      }
    } catch (error) {
      if (!(error.syscall === 'stat' && error.code === 'ENOENT' && error.path === 'data/session/bot')) {
        logDebug(`Error removing bot session: ${error}`);
      }
    }
  }
}
