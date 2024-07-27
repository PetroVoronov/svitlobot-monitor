const {Api, TelegramClient} = require('telegram');
const {StringSession, StoreSession} = require('telegram/sessions');
const readline = require('node:readline/promises');
const {stdin: input, stdout: output, exit} = require('node:process');
const stringify = require('json-stringify-safe');
const {LocalStorage} = require('node-localstorage');
const yargs = require('yargs');
const {Cache} = require('./modules/cache/Cache');
const {logLevelInfo, logLevelDebug, setLogLevel, logDebug, logInfo, logWarning, logError} = require('./modules/logging/logging');
const {NewMessage, NewMessageEvent} = require('telegram/events');
const {CallbackQuery, CallbackQueryEvent} = require('telegram/events/CallbackQuery');
const {name: scriptName, version: scriptVersion} = require('./version');
const i18n = require('./modules/i18n/i18n.config');
const axios = require('axios');

const storage = new LocalStorage('data/storage'),
  cache = new Cache({
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
  });

let telegramChatId = parseInt(process.env.TELEGRAM_CHAT_ID) || cache.getItem('telegramChatId') || 0,
  telegramTopicId = parseInt(process.env.TELEGRAM_TOPIC_ID) || cache.getItem('telegramTopicId') || 0,
  apiId = parseInt(process.env.TELEGRAM_API_ID) || cache.getItem('telegramApiId', 'number'),
  apiHash = process.env.TELEGRAM_API_HASH || cache.getItem('telegramApiHash'),
  botAuthToken = process.env.TELEGRAM_BOT_AUTH_TOKEN || cache.getItem('telegramBotAuthToken');

if (apiId) cache.setItem('telegramApiId', apiId);
if (apiHash) cache.setItem('telegramApiHash', apiHash);
if (botAuthToken) cache.setItem('telegramBotAuthToken', botAuthToken);
if (telegramChatId) cache.setItem('telegramChatId', telegramChatId);
if (telegramTopicId) cache.setItem('telegramTopicId', telegramTopicId);

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
  .option('i', {
    alias: 'time-interval',
    describe: 'Time interval in minutes, to detect the tendency',
    type: 'number',
    default: 2,
    demandOption: false,
  })
  .option('s', {
    alias: 'value-step',
    describe: 'Value step in percentage, to detect the tendency',
    type: 'number',
    default: 5,
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
  .option('b', {
    alias: 'as-bot',
    describe: 'Start as bot instance',
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
  .version(scriptVersion)
  .help('h')
  .alias('h', 'help')
  .epilog(`${scriptName} v${scriptVersion}`).argv;

setLogLevel(options.debug ? logLevelDebug : logLevelInfo);

i18n.setLocale(options.language);

const storeSession = new StoreSession(`data/session/${options.asBot ? 'bot' : 'user'}`),
  svitloBotAPI = 'https://api.svitlobot.in.ua/website/getChannelsForMap',
  cityId = 'Київ ->',
  groupId = `Київ -> Група ${options.group}`,
  statsBuffer = [],
  statsBufferMaxLength = 60,
  tendencyOn = 'on',
  tendencyOff = 'off',
  timeInterval = options.timeInterval * 60 * 1000,
  refreshInterval = options.refreshInterval * 60 * 1000;

let telegramClient = null,
  tendency = '';

function getAPIAttributes() {
  return new Promise((resolve, reject) => {
    if ((options.asBot === false && (apiId === null || apiHash === null)) || (botAuthToken === null && options.asBot === true)) {
      const rl = readline.createInterface({
        input,
        output,
      });
      if (options.asBot === false && (apiId === null || apiHash === null)) {
        rl.question('Enter your API ID: ')
          .then((id) => {
            apiId = parseInt(id);
            cache.setItem('telegramApiId', id);
            rl.question('Enter your API Hash: ')
              .then((hash) => {
                cache.setItem('telegramApiHash', apiHash);
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
        rl.question('Enter your Bot Auth Token: ')
          .then((token) => {
            cache.setItem('telegramBotAuthToken', botAuthToken);
            rl.close();
            resolve();
          })
          .catch((error) => {
            logError(`Error: ${error}`);
            rl.close();
            reject(error);
          });
      }
    } else {
      resolve();
    }
  });
}

function getMessageTargetIds() {
  return new Promise((resolve, reject) => {
    if (chatId === null || topicId === null) {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your chat ID: ')
        .then((id) => {
          chatId = id;
          cache.setItem('telegramChatId', id);
          rl.question('Enter your topic ID(0 - if no topics): ')
            .then((id) => {
              topicId = parseInt(id);
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
    if (options.asBot === true) {
      const client = new TelegramClient(storeSession, apiId, apiHash, {
        connectionRetries: 5,
        useWSS: true,
        connectionTimeout: 10000,
      });
      client
        .start({
          botAuthToken: botAuthToken,
        })
        .then(() => {
          logDebug('Telegram bot is connected');
          resolve(client);
        })
        .catch((error) => {
          logError(`Telegram bot connection error: ${error}`);
          reject(error);
        });
    } else {
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
          resolve(client);
        })
        .catch((error) => {
          rl.close();
          logError(`Telegram client connection error: ${error}`);
          reject(error);
        });
    }
  });
}

function getTelegramTargetEntity() {
  return new Promise((resolve, reject) => {
    telegramClient
      .getDialogs()
      .then((dialogs) => {
        const availableDialogs = dialogs.filter((dialog) => dialog.entity?.migratedTo === undefined || dialog.entity?.migratedTo === null),
          targetDialog = availableDialogs.find((item) => `${chatId}` === `${item.entity.id}`);
        if (targetDialog !== undefined) {
          if (topicId > 0) {
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
                  if (response.topics.find((topic) => topic.id === topicId) === undefined) {
                    logWarning(`Topic with id ${topicId} not found in ${targetDialog.title} (${chatId})!`);
                    reject(new Error(`Topic with id ${topicId} not found in ${targetDialog.title} (${chatId})!`));
                  } else {
                    resolve(targetDialog.entity);
                  }
                } else {
                  logWarning(`No topics found in ${targetDialog.title} (${chatId})!`);
                  reject(new Error(`No topics found in ${targetDialog.title} (${chatId})!`));
                }
              })
              .catch((error) => {
                reject(error);
              });
          } else {
            resolve(targetDialog.entity);
          }
        } else {
          reject(new Error(`Telegram chat with ID ${chatId} not found`));
        }
      })
      .catch((error) => {
        reject(error);
      });
  });
}

function gracefulExit() {
  if (telegramClient !== null && telegramClient.connected === true) {
    telegramClient.disconnect().then(() => {
      logInfo(`Telegram client is disconnected!`);
      telegramClient.destroy().then(() => {
        logInfo(`Telegram client is destroyed!`);
        telegramClient = null;
      });
    });
  } else {
    logInfo('All clients are disconnected!');
    exit(0);
  }
}

function telegramMessageOnChange(startedSwitchingOn) {
  const message = i18n.__(startedSwitchingOn ? 'Switching off is started' : 'Switching on is started'),
    timeStampOptions = {timeStyle: 'short', dateStyle: 'short'};
  if (options.timeZone) {
    timeStampOptions.timeZone = options.timeZone;
  }
  const timeStamp = new Date().toLocaleString(options.language, timeStampOptions),
    telegramMessage = {
      message: `${options.addTimestamp ? timeStamp + ': ' : ''}${message}`,
    };
  if (telegramClient !== null) {
    if (topicId > 0) {
      telegramMessage.replyTo = topicId;
    }
    telegramClient
      .sendMessage(targetEntity, telegramMessage)
      .then((message) => {
        logDebug(`Telegram message sent to ${chatId} with topic ${topicId}`);
        if (options.pinMessage) {
          telegramClient
            .pinMessage(targetEntity, message.id)
            .then(() => {
              logDebug(`Telegram message pinned to ${chatId} with topic ${topicId}`);
              if (options.unpinPrevious) {
                const previousMessageId = cache.getItem('lastMessageId');
                if (previousMessageId !== undefined) {
                  telegramClient.unpinMessage(targetEntity, previousMessageId).then(() => {
                    logDebug(`Telegram message unpinned from ${chatId} with topic ${topicId}`);
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
    logInfo(`${telegramMessage.message}`);
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
        if (items.length === 12 && items[3].startsWith(cityId) && items[9] === groupId && '12'.includes(items[1])) {
          groupData.push({
            on: items[1] === '1',
            timeStamp: new Date(items[2]).valueOf(),
          });
        }
      });
      const groupDataOn = dataClean(groupData.filter((item) => item.on === true)),
        groupDataOff = dataClean(groupData.filter((item) => item.on === false)),
        dateBack = new Date(new Date().valueOf() - timeInterval);
      stats.on = groupDataOn.length;
      stats.off = groupDataOff.length;
      stats.total = stats.on + stats.off;
      stats.percentage = stats.total > 0 ? Math.round((stats.on / stats.total) * 100) : 0;
      logDebug(
        `For group ${groupId} - "on" percentage is ${stats.percentage}%, the other statistics are: ${stats.on} "on", ${stats.off} "off", ${stats.total} total`,
      );
      statsBuffer.push(stats);
      if (statsBuffer.length > statsBufferMaxLength) {
        statsBuffer.shift();
      }
      const statsToCompare = statsBuffer.find((item) => item.timeStamp >= dateBack);
      if (statsToCompare !== undefined) {
        const percentageDelta = Math.abs(stats.percentage - statsToCompare.percentage);
        if (percentageDelta >= options.valueStep) {
          if (stats.percentage > statsToCompare.percentage) {
            if (tendency !== tendencyOn) {
              tendency = tendencyOn;
              telegramMessageOnChange(true);
            }
          } else {
            if (tendency !== tendencyOff) {
              tendency = tendencyOff;
              telegramMessageOnChange(false);
            }
          }
        }
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

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

if (options.noTelegram === true) {
  startCheckGroupTendency();
} else {
  logInfo('Starting Telegram client...');
  getAPIAttributes()
    .then(() => {
      getMessageTargetIds()
        .then(() => {
          getTelegramClient()
            .then((client) => {
              logInfo('Telegram client is connected. Getting target entity ...');
              telegramClient = client;
              telegramClient.setParseMode('html');
              getTelegramTargetEntity()
                .then((entity) => {
                  logInfo('Telegram target entity is found. ');
                  targetEntity = entity;
                  startCheckGroupTendency();
                })
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
    })
    .catch((error) => {
      logError(`Error: ${error}`);
      gracefulExit();
    });
}
