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
const fs = require('node:fs');

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
  .option('w', {
    alias: 'wrong-groups',
    describe: 'File with wrong groups',
    type: 'string',
    default: '',
    demandOption: false,
  })
  .option('reassign-groups', {
    describe: 'Reassign groups from the Yasno site',
    type: 'boolean',
    default: false,
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
  timeInterval = (options.timeInterval * 60 + 1) * 1000,
  refreshInterval = options.refreshInterval * 60 * 1000;
  (nominatimReverseAPI = 'https://nominatim.openstreetmap.org/reverse'),
    (nominatimHeaders = {
      'User-Agent': `${scriptName} v${scriptVersion}`,
      'Accept-Language': 'uk-UA,uk;q=0.9',
    }),
    (nominatimTimeoutMin = 1500),
    (reassignData = cache.getItem('reassignData') || []),
    streetsRenames = {};
let telegramClient = null,
  wrongGroups = [],
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
    if (telegramChatId === null || telegramTopicId === null) {
      const rl = readline.createInterface({
        input,
        output,
      });
      rl.question('Enter your chat ID: ')
        .then((id) => {
          telegramChatId = id;
          cache.setItem('telegramChatId', id);
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
          targetDialog = availableDialogs.find((item) => `${telegramChatId}` === `${item.entity.id}`);
        if (targetDialog !== undefined) {
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
                  if (response.topics.find((topic) => topic.id === telegramTopicId) === undefined) {
                    logWarning(`Topic with id ${telegramTopicId} not found in ${targetDialog.title} (${telegramChatId})!`);
                    reject(new Error(`Topic with id ${telegramTopicId} not found in ${targetDialog.title} (${telegramChatId})!`));
                  } else {
                    resolve(targetDialog.entity);
                  }
                } else {
                  logWarning(`No topics found in ${targetDialog.title} (${telegramChatId})!`);
                  reject(new Error(`No topics found in ${targetDialog.title} (${telegramChatId})!`));
                }
              })
              .catch((error) => {
                reject(error);
              });
          } else {
            resolve(targetDialog.entity);
          }
        } else {
          reject(new Error(`Telegram chat with ID ${telegramChatId} not found`));
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
        exit(0);
      });
    });
  } else {
    logInfo('All clients are disconnected!');
    exit(0);
  }
}

function telegramMessageOnChange(startedSwitchingOn) {
  const message = i18n.__(startedSwitchingOn ? 'Group %s - switching to on is started' : 'Group %s - switching to off is started', groupId),
    timeStampOptions = {timeStyle: 'short', dateStyle: 'short'};
  if (options.timeZone) {
    timeStampOptions.timeZone = options.timeZone;
  }
  const timeStamp = new Date().toLocaleString(options.language, timeStampOptions),
    telegramMessage = {
      message: `${options.addTimestamp ? timeStamp + ': ' : ''}${message}`,
    };
  if (telegramClient !== null) {
    if (telegramTopicId > 0) {
      telegramMessage.replyTo = telegramTopicId;
    }
    telegramClient
      .sendMessage(targetEntity, telegramMessage)
      .then((message) => {
        logDebug(`Telegram message sent to ${telegramChatId} with topic ${telegramTopicId}`);
        if (options.pinMessage) {
          telegramClient
            .pinMessage(targetEntity, message.id)
            .then(() => {
              logDebug(`Telegram message pinned to ${telegramChatId} with topic ${telegramTopicId}`);
              if (options.unpinPrevious) {
                const previousMessageId = cache.getItem('lastMessageId');
                if (previousMessageId !== undefined) {
                  telegramClient.unpinMessage(targetEntity, previousMessageId).then(() => {
                    logDebug(`Telegram message unpinned from ${telegramChatId} with topic ${telegramTopicId}`);
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
        if (
          items.length === 12 &&
          items[3].startsWith(cityId) &&
          ((options.reassignGroups === false && items[9] === groupId) ||
            (options.reassignGroups === true &&
              reassignData.find((item) => item.latitude === items[6] && item.longitude === items[7])?.groupId == options.group)) &&
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
        groupDataOff = dataClean(groupData.filter((item) => item.on === false)),
        dateBack = new Date(new Date().getTime() - timeInterval);
      stats.on = groupDataOn.length;
      stats.off = groupDataOff.length;
      stats.total = stats.on + stats.off;
      stats.percentage = stats.total > 0 ? Math.round((stats.on / stats.total) * 100) : 0;
      if (stats.total !== 0) {
        logDebug(
          `For group ${groupId} - "on" percentage is ${stats.percentage}%, the other statistics are: ${stats.on} "on", ${stats.off} "off", ${stats.total} total`,
        );
        statsBuffer.push(stats);
        if (statsBuffer.length > statsBufferMaxLength) {
          statsBuffer.shift();
        }
        const statsToCompare = statsBuffer.find((item) => item.timeStamp.getTime() >= dateBack.getTime());
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
        logWarning(`No data found for group ${groupId}!`);
      }
    } else {
      logWarning('No data received from SvitloBot API!');
    }
  });
}

function startCheckGroupTendency() {
  if (options.reassignGroups) {
    reassignGroups();
    checkGroupTendency();
  } else {
    checkGroupTendency();
    setInterval(() => {
      checkGroupTendency();
    }, refreshInterval);
  }
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

function readStreetsRenames() {
  return new Promise((resolve, reject) => {
    fs.readFile('streets_renames.csv', 'utf8', (error, data) => {
      if (error) {
        resolve();
      } else {
        data.split('\n').forEach((line) => {
          const items = line.split(';');
          if (items.length === 2) {
            streetsRenames[items[0]] = items[1];
          }
        });
        resolve();
      }
    });
  });
}

async function reassignGroups() {
  const yasnoAPI = {
      base: 'https://api.yasno.com.ua/api/v1',
      city: '/electricity-outages-schedule/cities',
      street: '/electricity-outages-schedule/streets',
      building: '/electricity-outages-schedule/houses',
      schedule: '/pages/home/schedule-turn-off-electricity',
    },
    streetTypes = [
      {
        id: 'вул.',
        keys: ['вулиця', 'вул.'],
      },
      {
        id: 'просп.',
        keys: ['проспект', 'просп.', 'просп ', 'пр-т', 'пр.', 'проспю'],
      },
      {
        id: 'пл.',
        keys: ['площа', 'пл.'],
      },
      {
        id: 'пров.',
        keys: ['провулок', 'пров.', 'пров '],
      },
      {
        id: 'шосе',
        keys: ['шосе', 'шос.', 'шос '],
      },
      {
        id: 'бул.',
        keys: ['бульвар', 'бульв.', /* 'бульв ',  */'б-р', 'бул.', 'бул '],
      },
      {
        id: 'проїзд',
        keys: ['проїзд', 'проїзд.', 'проїзд ', 'пр-д', 'пр-д.', 'пр-д '],
      },
      {
        id: 'наб.',
        keys: ['набережна', 'наб.', 'наб '],
      },
    ];
  const responseStreets = await axios.get(`${yasnoAPI.base}${yasnoAPI.street}?region=kiev`);
  let streets = responseStreets.data;
  if (streets.length > 0) {
    streets = streets
      .filter((item) => item.name.includes('(') === false && item.name.includes(',') === false)
      .map((item) => ({
        id: item.id,
        name: item.name
          .replaceAll('  ', ' ')
          .replace(/\.(\S)/g, '. $1')
          .replace(/(\S)\(/, '$1 (')
          .replaceAll(' II', ' 2-го')
          .toLocaleLowerCase(),
      }));
    const responseSvitloBot = await axios.get(svitloBotAPI),
      data = responseSvitloBot.data;
    if (typeof data === 'string' && data.length > 0) {
      const lines = data.split('\n');
      // const lines = [
      //     '-1;&&&;1;&&&;2024-07-25T19:25:45+00:00;&&&;Київ -> Бульварно-Кудрявська 9;&&&;svitlobot_bulvarno_kudravska_9;&&&;19;&&&;50.4534493;&&&;30.504217;&&&;1;&&&;-;&&&;1;&&&;',
      //   ],
        groupData = [];
      let wrongCount = 0,
        cityTotal = 0,
        wrongBuildingCount = 0,
        groupOne = 0,
        index = 0;
      for (const line of lines) {
        const items = line.split(';&&&;');
        if (items.length === 12 && items[3]?.startsWith(cityId)) {
          const addressRaw = items[3].replace(`${cityId} `, '').replace(`${cityId}`, '').toLocaleLowerCase();
          if (
            (items[6].match(/\d+\.\d{5,}/) &&
              items[7].match(/\d+\.\d{5,}/) &&
              reassignData.find((item) => item.latitude === items[6] && item.longitude === items[7]) === undefined) /* ||
            reassignData.find((item) => item.latitude === items[6] && item.longitude === items[7])?.groupId === 0 */
          ) {
            const reassignCurrent = {
              latitude: items[6],
              longitude: items[7],
              address: items[3],
              groupId: 0,
            };
            let nominatimTimeout = 600;
            await new Promise((resolve) => setTimeout(resolve, 600));
            const responseAddress = await axios.get(
              `${nominatimReverseAPI}?format=jsonv2&lat=${items[6]}&lon=${items[7]}&zoom=18&addressdetails=1&layer=address`,
              {
                nominatimHeaders,
              },
            );
            const addressData = responseAddress.data;
            if (
              typeof addressData?.address?.house_number === 'string' &&
              addressData.address.house_number.length > 0 &&
              typeof addressData?.address?.road === 'string' &&
              addressData.address.road.length > 0
            ) {
              let streetType = '',
                addressNoType = addressData.address.road.toLocaleLowerCase();
              const streetPossibilities = [addressNoType];
              if (streetsRenames[addressNoType] !== undefined) {
                streetPossibilities.push(...streetsRenames[addressNoType].split(','));
              }
              for (const type of streetTypes) {
                for (const key of type.keys) {
                  if (addressNoType.includes(key)) {
                    streetType = type.id;
                    // addressNoType = addressNoType.replace(key, '').replaceAll('ʼ', "'");
                    for (i = 0; i < streetPossibilities.length; i++) {
                      streetPossibilities[i] = streetPossibilities[i].replace(key, '');
                    }
                    break;
                  }
                }
                if (streetType.length > 0) {
                  break;
                }
              }
              reassignCurrent.street = addressData.address.road;
              reassignCurrent.building = addressData.address.house_number;

              let building = addressData.address.house_number.toLocaleLowerCase();
              // console.log(`Street: ${street}, Type: ${streetType}, Building: ${building}`);
              const streetVariations = [];
              streetPossibilities.forEach((streetAddress) => {
                const addressSplitted = streetAddress.split(' ').filter((item) => item.length > 0),
                  street = addressSplitted.join(' '),
                  streetReverse = addressSplitted.reverse().join(' ');
                streetVariations.push(street);
                if (street !== streetReverse) {
                  streetVariations.push(streetReverse);
                }
                if (addressSplitted.length === 2) {
                  streetVariations.push(
                    `${addressSplitted[0][0]}. ${addressSplitted[1]}`,
                    `${addressSplitted[1][0]}. ${addressSplitted[0]}`,
                  );
                }
              });
              let streetData = [],
                streetsData = [];
              for (const street of streetVariations) {
                streetData = streets.filter((item) => item.name == `${streetType.length > 0 ? streetType + ' ' : ''}${street}`);
                if (streetData.length >= 1) {
                  streetsData.push(...streetData);
                }
              }
              if (streetsData.length === 0) {
                wrongCount++;
                // console.log(
                //   'Wrong street data: ',
                //   `Raw: ${addressRaw}, Street: ${street}, Type: ${streetType}, Building: ${building}, Street data: ${stringify(streetData)}`,
                // );
              } else {
                if (building.match(/^\d+\D$/)) {
                  const buildingData = /^(\d+)(\D)$/.exec(building);
                  if (buildingData !== null && buildingData.length === 3) {
                    building = `${buildingData[1]}/${buildingData[2]}`;
                  }
                } else {
                  building = building.replace('-', '/');
                }
                for (const streetId of streetsData.map((item) => item.id)) {
                  await new Promise((resolve) => setTimeout(resolve, 400));
                  nominatimTimeout += 400;
                  const responseBuildings = await axios.get(`${yasnoAPI.base}${yasnoAPI.building}?region=kiev&street_id=${streetId}`),
                    buildings = responseBuildings.data;
                  if (Array.isArray(buildings) && buildings.length > 0) {
                    const buildingData = buildings.filter(
                      (item) => item.name.toLocaleLowerCase() == building /* ||
                        (item.name.match(/^\d+\/\d+/) && item.name.startsWith(`${building}/`)) ||
                        (building.match(/^\d+\/\d+/) && item.name === building.split('/')[0]) */,
                    );
                    if (buildingData.length === 1) {
                      reassignCurrent.groupId = buildingData[0].group;
                      /* console.log(
                        `Raw: ${addressRaw}, Street: ${street}, Type: ${streetType}, Building: ${building}, StreetId: ${streetId}, Building data: ${stringify(
                          buildingData,
                        )}`,
                      ); */
                    } else  if (buildingData.length > 1 ) {
                      const firstItemGroup = buildingData[0].group;
                      if (buildingData.every((item) => item.group === firstItemGroup)) {
                        reassignCurrent.groupId = firstItemGroup;
                      } else {
                        console.log(
                          'Multiple groups data: ',
                          `Raw: ${addressRaw}, Street: ${streetPossibilities}, Type: ${streetType}, Building: ${building}, Buildings data: ${stringify(
                            buildingData,
                          )}`,
                        );
                      }
                    } else {
                      const buildingDataStarts =  buildings.filter(
                      (item) => item.name.toLocaleLowerCase().startsWith(`${building}/`)
                      );
                      if (buildingDataStarts.length === 1) {
                        reassignCurrent.groupId = buildingDataStarts[0].group;
                      } else if (buildingDataStarts.length > 1) {
                        const firstItemGroup = buildingDataStarts[0].group;
                        if (buildingDataStarts.every((item) => item.group === firstItemGroup)) {
                          reassignCurrent.groupId = firstItemGroup;
                        } else {
                          console.log(
                            'Multiple groups data: ',
                            `Raw: ${addressRaw}, Street: ${streetPossibilities}, Type: ${streetType}, Building: ${building}, Buildings data: ${stringify(
                              buildingDataStarts,
                            )}`,
                          );
                        }
                      }
                    }
                  }
                }
              }
              if (reassignCurrent.groupId === 0) {
                wrongBuildingCount++;
                console.log(
                  'Wrong building data: ',
                  `Raw: ${addressRaw}, Street: ${streetPossibilities}, Type: ${streetType}, Building: ${building}, Streets data: ${stringify(
                    streetsData,
                  )}`,
                );
              } else if (reassignCurrent.groupId === 1) {
                groupOne++;
              }
            }
            if (nominatimTimeout < nominatimTimeoutMin) {
              await new Promise((resolve) => setTimeout(resolve, nominatimTimeoutMin - nominatimTimeout));
            }
            const currentIndex = reassignData.findIndex((item) => item.latitude === items[6] && item.longitude === items[7]);
            if (currentIndex !== -1) {
              reassignData[currentIndex] = reassignCurrent;
            } else {
              reassignData.push(reassignCurrent);
            }
            index++;
          } else if (reassignData.find((item) => item.latitude === items[6] && item.longitude === items[7])?.groupId === 1) {
            groupOne++;
          } /*  else if (reassignData.find((item) => item.latitude === items[6] && item.longitude === items[7])?.groupId === 0) {
            wrongBuildingCount++;
          } */
          cityTotal++;
          // if (index > 50) {
          //   break;
          // }
        }
      }
      cache.setItem('reassignData', reassignData);
      console.log(`Wrong count: ${wrongCount}, wrong building count: ${wrongBuildingCount}, total: ${lines.length}`);
      console.log(`Group one count: ${groupOne}, addresses "good": ${cityTotal - wrongCount - wrongBuildingCount}`);
    }
  }
}

process.on('SIGINT', gracefulExit);
process.on('SIGTERM', gracefulExit);

readStreetsRenames().then(() => {
  readWrongGroups().then(() => {
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
  });
});