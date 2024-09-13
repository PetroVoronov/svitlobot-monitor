# Svitlobot monitor

[![Docker Image Version](https://img.shields.io/docker/v/petrovoronov/svitlobot-monitor)](https://hub.docker.com/r/petrovoronov/svitlobot-monitor)
[![Docker Pulls](https://img.shields.io/docker/pulls/petrovoronov/svitlobot-monitor)](https://hub.docker.com/r/petrovoronov/svitlobot-monitor)
[![GitHub license](https://img.shields.io/github/license/PetroVoronov/svitlobot-monitor)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/PetroVoronov/svitlobot-monitor)](https://github.com/PetroVoronov/svitlobot-monitor/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/PetroVoronov/svitlobot-monitor)](https://github.com/PetroVoronov/svitlobot-monitor/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/PetroVoronov/svitlobot-monitor)](https://github.com/PetroVoronov/svitlobot-monitor/pulls)

[![Ukrainian translation](https://img.shields.io/static/v1?label=Readme&message=Ukrainian&labelColor=1f5fb2&color=fad247)](README-uk.md)

## About

This project check the data from Svtilobot API and send the electricity switching on or off tendency indication for the appropriate DTEK group to the appropriate telegram user/chat/group/forum.
By using this application, you will be able to receive notifications about the start of power outages or restorations for your group before it happens to you.

## Features

- Retrieves and connects to Telegram client;
- Check the electricity supply status in the appropriate group in Kyiv and send the tendency indication to the appropriate telegram user/chat/group/forum;

## Prerequisites

- Node.js or Docker installed.
- Telegram account API ID and hash or Telegram Bot token if alert will be generated by bot, and target user/chat/group/forum ID (including topicId for the forum). Details about the Telegram API can be found [here](https://core.telegram.org/api/obtaining_api_id).
- The Telegram target user, chat or group/forum ID and the topic ID for the forum (in other case is has to be set to 0).

### Obtaining the Telegram Chat ID

The Telegram user ID can be obtained by interacting with the [IDBot](https://t.me/myidbot) in Telegram. You can start a chat with the bot and it will provide you with your user ID.
Additionally, you can use this bot to obtain the chat ID of a group or channel by adding the bot to the group/channel and sending a message to the bot. The bot will reply with the chat ID.

### Obtaining the Telegram Topic ID

Post a message to that topic, then right-click on it and select Copy Message Link . Paste it on a scratchpad and notice that it has the following structure https://t.me/c/XXXXXXXXXX/YY/ZZ . The topic ID is YY (integer).

## Installation

### Docker image installation

```sh
docker pull petrovoronov/svitlobot-monitor
```

### Node.js installation from the source code

   1. Clone the repository:
        ```sh
        git clone https://github.com/PetroVoronov/svitlobot-monitor.git
        cd svitlobot-monitor
        ```

   2. Install dependencies:
        ```sh
        npm install
        ```

## Passing the basic configuration parameters
Basic configuration parameters, including Telegram credentials can be passed as environment variables, or you can skip it and application will ask you to enter it interactively.

### Environment variables in case of working as telegram user (default):
```sh
export TELEGRAM_API_ID=your_telegram_api_id
export TELEGRAM_API_HASH=your_telegram_api_hash
export TELEGRAM_CHAT_ID=your_telegram_chat_id
export TELEGRAM_TOPIC_ID=your_telegram_topic_id
```

### Environment variables in  case of working as telegram bot:

```sh
export TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token
export TELEGRAM_CHAT_ID=your_telegram_chat_id
export TELEGRAM_TOPIC_ID=your_telegram_topic_id
```

After first run these parameters will be stored in the `data/storage` directory and will be used for the next runs.
So you will be asked to enter the parameters only once (or you should pass it as environment variables only on the first run).

**Important notice: if you want to change the parameters you should pass it again as environment variables at any time.**

## Command-line Options

### Command-Line Parameters

The script accepts various command-line parameters to customize its behavior. Below is a list of the available options:

| Option                           |  Alias  | Description | Type | Default | Required |
|----------------------------------|---------|-------------|------|---------|----------|
| `--language`                     | `-l`    | Language code for i18n | `string` | `en` | No |
| `--group`                        | `-g`    | DTEK group id | `number` | `1` | No |
| `--step-interval-pair`           | `-s`    | Value step in percentage and time interval in minutes, to detect the tendency. Format is "percentage:time" | `array` | | No |
| `--max-percentage-to-react-down` | `--max` | Value in percentage, to react on decrease of percentage | `number` | `80` | No |
| `--min-percentage-to-react-up`   | `--min` | Value in percentage, to react on increase of percentage | `number` | `30` | No |
| `--period-of-fixed-tendency`     |         | Period in minutes, the tendency is usually not changed on opposite | `number` | `60` | No |
| `--refresh-interval`             | `-r`    | Refresh interval in minutes, to get the data | `number` | `1` | No |
| `--no-telegram`                  | `-n`    | Start without Telegram client | `boolean` | | No |
| `--as-user`                      |         | Start as user instance (bot instance by default) | `boolean` | | No |
| `--pin-message`                  | `-p`    | Unpin message from chat | `boolean` | `false` | No |
| `--unpin-previous`               | `-u`    | Pin message to chat | `boolean` | `false` | No |
| `--add-timestamp`                | `-t`    | Add timestamp to message | `boolean` | `false` | No |
| `--time-zone`                    | `-tz`   | Time zone for timestamp | `string` | `process.env.TZ` or `''` | No |
| `--wrong-groups`                 | `-w`    | File with wrong groups | `string` | `''` | No |
| `--debug`                        | `-d`    | Debug level of logging | `boolean` | | No |

#### Available Options for `--step-interval-pair`

The `--step-interval-pair` parameter accepts values in the format "percentage:time". This parameter is used to detect the tendency by specifying a value step in percentage and a time interval in minutes. Here are some examples of how you can use this parameter:

- `--step-interval-pair 5:10`: This means a 5% change over a 10-minute interval.
- `--step-interval-pair 10:30`: This means a 10% change over a 30-minute interval.
- `--step-interval-pair 15:60`: This means a 15% change over a 60-minute interval.

You can specify multiple pairs by separating them with a space. For example:

- `--step-interval-pair 5:10 10:30 15:60`

This allows the script to detect tendencies based on different step and interval combinations.

### Usage Example

```sh
node index.js --language uk --group 2 --refresh-interval 5 --debug
```

## Running the Application

### Node.js

There is an example with all possible command-line options:

```sh
node index.js --language uk --group 2 --refresh-interval 5 --as-user --pin-message --unpin-previous --add-timestamp --time-zone "Europe/Kiev"
```

### Docker

By default the application will run as a telegram user instance and without any additional command-line options.

Due to the limitations of the Docker environment, the application will not be able to ask for the missing configuration parameters interactively. That's why you need to make a first run in interactive mode to provide the missing parameters.

#### Docker Volumes

**You must to map the application data directory to the container:**
- `/app/data` - for the application data, including the configurations and the some other actual data. Mandatory for the mapping!
You can map in on any local directory on the host system or docker volume.

Additionally, you can map the localization directory to the container:
- `/app/locales` - for the localization files, if  you want to use own messages in the telegram chat. Optional for the mapping.

#### Docker first run

So, the first run should be like one of the following:
- to work as telegram user and set all basic configuration parameters interactively:
    ```sh
    docker run -it --name svitlobot-monitor \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        petrovoronov/svitlobot-monitor:latest \
        node src/index.js --as-user --language uk --group 2 --refresh-interval 5
    ```

- to work as telegram user and set all basic configuration parameters as environment variables:
    ```sh
    docker run -d --name svitlobot-monitor \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        -e TELEGRAM_API_ID=your_telegram_api_id \
        -e TELEGRAM_API_HASH=your_telegram_api_hash \
        -e TELEGRAM_CHAT_ID=your_telegram_chat_id \
        -e TELEGRAM_TOPIC_ID=your_telegram_topic_id \
        petrovoronov/svitlobot-monitor:latest \
        node src/index.js --as-user --language uk --group 2 --refresh-interval 5
    ```

- to work as telegram bot and set all basic configuration parameters interactively:
    ```sh
    docker run -it --name svitlobot-monitor \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        petrovoronov/svitlobot-monitor:latest \
        node src/index.js --language uk --group 2 --refresh-interval 5
    ```


- to work as telegram bot and  all basic configuration parameters as environment variables:
    ```sh
    docker run -d --name svitlobot-monitor \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        -e TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token \
        -e TELEGRAM_CHAT_ID=your_telegram_chat_id \
        -e TELEGRAM_TOPIC_ID=your_telegram_topic_id \
        petrovoronov/svitlobot-monitor:latest \
        node src/index.js --language uk --group 2 --refresh-interval 5
    ```
**Important notice: pass all later needed command-line options at first run!***

After the first run the application will store the configuration parameters and additional info - please stop the container by pressing `Ctrl+C` and start it again with the commands from the next section.

#### Docker next runs

After the first run you can run the application with the same configuration parameters as the previous run without any additional command-line options.

To start the application, run the following command:

```sh
docker start svitlobot-monitor
```

To stop the application, run the following command:

```sh
docker stop svitlobot-monitor
```

### Docker Compose

To run the application using Docker Compose, create a `docker-compose.yml` file with the following content:


### In case of working as telegram user:

```yaml
version: '3'
services:
    svitlobot-monitor:
        image: petrovoronov/svitlobot-monitor:latest
        volumes:
            - /path/to/your/data:/app/data
            - /path/to/your/locales:/app/locales
        environment:
            - TELEGRAM_API_ID=your_telegram_api_id
            - TELEGRAM_API_HASH=your_telegram_api_hash
            - TELEGRAM_CHAT_ID=your_telegram_chat_id
            - TELEGRAM_TOPIC_ID=your_telegram_topic_id
        command: node src/index.js --as-user --language uk --group 2 --refresh-interval 5
```

### In case of working as telegram bot:


```yaml
version: '3'
services:
    svitlobot-monitor:
        image: petrovoronov/svitlobot-monitor:latest
        volumes:
            - /path/to/your/data:/app/data
            - /path/to/your/locales:/app/locales
        environment:
            - TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token
            - TELEGRAM_CHAT_ID=your_telegram_chat_id
            - TELEGRAM_TOPIC_ID=your_telegram_topic_id
        command: node src/index.js --language uk --group 2 --refresh-interval 5
```

Replace `/path/to/your/data` and `/path/to/your/locales` with the actual paths on your system where you want to store the application data and localization files.

Then, run the following command to start the application:

```sh
docker-compose up -d
```

This will start the application as a Telegram bot instance with the specified configuration parameters.

## Localization

The application supports sending the alerts to telegram in different languages. The default language is English (`en`).
You can change the language by passing the `--language` command-line option with the language code.
You can change the messages by editing the localization files in the `locales` directory.

### Adding a New Language
You can add a new language by creating a new localization file in the `locales` directory with the language code as the filename (e.g., `fr.json` for French). And then you can add the translations for the messages in the new file.
```json
{
    "Group %s - switching to on is started": "Groupe %s - commutation en marche est démarrée",
    "Group %s - switching to off is started": "Groupe %s - commutation à l'arrêt est démarrée",
}
```
Then you can pass the language code as the value of the `--language` command-line option to use the new language.

### Localization Files for Docker
In case of using Docker, you can map the `locales` directory to the container to use the own localization files for the messages in the telegram chat.
But in this case after first run you will have only the **empty files** in the appropriate `locales` directory in the host system. Then you can edit/add the needed localization files to the `locales` directory in the host system and restart the container.


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.