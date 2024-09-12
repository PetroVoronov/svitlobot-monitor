### Svitlobot Monitor

[![Docker Image Version](https://img.shields.io/docker/v/petrovoronov/svitlobot-monitor)](https://hub.docker.com/r/petrovoronov/svitlobot-monitor)
[![Docker Pulls](https://img.shields.io/docker/pulls/petrovoronov/svitlobot-monitor)](https://hub.docker.com/r/petrovoronov/svitlobot-monitor)
[![GitHub license](https://img.shields.io/github/license/PetroVoronov/svitlobot-monitor)](LICENSE)
[![GitHub last commit](https://img.shields.io/github/last-commit/PetroVoronov/svitlobot-monitor)](https://github.com/PetroVoronov/svitlobot-monitor/commits/main)
[![GitHub issues](https://img.shields.io/github/issues/PetroVoronov/svitlobot-monitor)](https://github.com/PetroVoronov/svitlobot-monitor/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/PetroVoronov/svitlobot-monitor)](https://github.com/PetroVoronov/svitlobot-monitor/pulls)


## Опис

Цей проєкт перевіряє дані з API Svitlobot і надсилає індикацію тенденції вмикання чи вимикання електроенергії для відповідної групи ДТЕК до відповідного користувача, чату, групи чи форуму в Telegram.
Тобто використовуючи цю аплікацію ви зможете отримати повідомлення про початок вимикання або вмикання електроенергії по вашої групі до того, як це станется у вас.

## Особливості

- Підключення до клієнта Telegram;
- Перевірка статусу електропостачання у відповідній групі  ДТЕК в Києві та відсилання індикації тенденції відповідному користувачу, чату, групі чи форуму в Telegram;

## Вимоги

- Встановлений Node.js або Docker.
- Telegram API ID та hash, токен бота (якщо сповіщення генеруватимуться ботом), ідентифікатор цільового користувача, чату, групи або форуму (включаючи topicId для форуму). Деталі про Telegram API можна знайти [тут](https://core.telegram.org/api/obtaining_api_id).
- Ідентифікатор цільового користувача Telegram, чату або групи/форуму і topicId для форуму (в іншому випадку має бути встановлено значення 0).

### Як отримати ідентифікатор чату в Telegram

Ідентифікатор користувача Telegram можна отримати, взаємодіючи з [IDBot](https://t.me/myidbot) у Telegram. Ви можете почати чат із ботом, і він надасть вам ваш ідентифікатор користувача. Крім того, ви можете використовувати цей бот для отримання ідентифікатора чату групи або каналу, додавши бота до групи/каналу і надіславши йому повідомлення. Бот відповість з ідентифікатором чату.

### Як отримати ідентифікатор теми в Telegram

Надішліть повідомлення в цю тему, потім клацніть правою кнопкою миші на повідомлення і виберіть "Копіювати посилання на повідомлення". Вставте його в будь-який текстовий редактор і зверніть увагу, що воно має наступну структуру: https://t.me/c/XXXXXXXXXX/YY/ZZ. Ідентифікатор теми - це YY (ціле число).

## Встановлення

### Встановлення Docker-образу

```sh
docker pull petrovoronov/svitlobot-monitor
```

### Встановлення Node.js з вихідного коду

1. Клонуйте репозиторій:
   ```sh
   git clone https://github.com/PetroVoronov/svitlobot-monitor.git
   cd svitlobot-monitor
   ```

2. Встановіть залежності:
   ```sh
   npm install
   ```

## Передача базових параметрів конфігурації

Базові параметри конфігурації, включаючи облікові дані Telegram, можуть бути передані як змінні середовища:

```sh
export TELEGRAM_API_ID=your_telegram_api_id
export TELEGRAM_API_HASH=your_telegram_api_hash
export TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token
export TELEGRAM_CHAT_ID=your_telegram_chat_id
export TELEGRAM_TOPIC_ID=your_telegram_topic_id
```

Або ви можете пропустити це, і програма запросить вас ввести їх інтерактивно.

Після першого запуску ці параметри будуть збережені в каталозі `data/storage` і будуть використовуватися для наступних запусків. Таким чином, вам буде запропоновано ввести параметри лише один раз (або ви повинні передати їх як змінні середовища тільки під час першого запуску).

**Важлива примітка: якщо ви хочете змінити параметри, вам слід передати їх знову як змінні середовища у будь-який час.**

## Опції командного рядка

### Параметри командного рядка

Скрипт приймає різні параметри командного рядка для налаштування своєї поведінки. Нижче наведено список доступних опцій:

| Опція | Псевдонім | Опис | Тип | Значення за замовчуванням | Обов'язково |
|-------|-----------|------|-----|---------------------------|-------------|
| `--language` | `-l` | Код мови для i18n | `рядок` | `en` | Ні |
| `--group` | `-g` | Ідентифікатор групи DTEK | `число` | `1` | Ні |
| `--step-interval-pair` | `-s` | Крок значення у відсотках і часовий інтервал у хвилинах для визначення тенденції. Формат: "відсотки:час" | `масив` | | Ні |
| `--max-percentage-to-react-down` | `--max` | Значення у відсотках для реакції на зменшення відсотка | `число` | `80` | Ні |
| `--min-percentage-to-react-up` | `--min` | Значення у відсотках для реакції на збільшення відсотка | `число` | `30` | Ні |
| `--period-of-fixed-tendency` | | Період у хвилинах, коли тенденція звичайно не змінюється на протилежну | `число` | `60` | Ні |
| `--refresh-interval` | `-r` | Інтервал оновлення в хвилинах для отримання даних | `число` | `1` | Ні |
| `--no-telegram` | `-n` | Запуск без клієнта Telegram | `булевий` | | Ні |
| `--as-bot` | `-b` | Запуск у якості екземпляра бота | `булевий` | | Ні |
| `--pin-message` | `-p` | Закріпити повідомлення в чаті | `булевий` | `false` | Ні |
| `--unpin-previous` | `-u` | Відкріпити попереднє повідомлення | `булевий` | `false` | Ні |
| `--add-timestamp` | `-t` | Додати часову мітку до повідомлення | `булевий` | `false` | Ні |
| `--time-zone` | `-tz` | Часовий пояс для часової мітки | `рядок` | `process.env.TZ` або `''` | Ні |
| `--debug` | `-d` | Рівень логування для налагодження | `булевий` | | Ні |
| `--wrong-groups` | `-w` | Файл із неправильними групами | `рядок` | `''` | Ні |

#### Доступні опції для `--step-interval-pair`

Параметр `--step-interval-pair` приймає значення у форматі "відсотки:час". Цей параметр використовується для визначення тенденції, задаючи крок значення у відсотках та часовий інтервал у хвилинах. Ось декілька прикладів, як можна використовувати цей параметр:

- `--step-interval-pair 5:10`: Це означає зміну на 5% протягом 10 хвилин.
- `--step-interval-pair 10:30`: Це означає зміну на 10% протягом 30 хвилин.
- `--step-interval-pair 15:60`: Це означає зміну на 15% протягом 60 хвилин.

Ви можете вказати кілька пар, розділивши їх пробілами. Наприклад:

- `--step-interval-pair 5:10 10:30 15:60`

Це дозволяє скрипту визначати тенденції на основі різних комбінацій кроків і інтервалів.

### Приклад використання

```sh
node index.js --language uk --group 2 --refresh-interval 5 --debug
```

## Запуск додатку

### Node.js

Приклад з усіма можливими опціями командного рядка:

```sh
node index.js --language uk --group 2 --refresh-interval 5 --as-bot --pin-message --unpin-previous --add-timestamp --time-zone "Europe/Kiev"
```

### Docker

За замовчуванням додаток запускається як користувач Telegram без додаткових параметрів командного рядка.

Через обмеження середовища Docker, додаток не зможе інтерактивно запитувати відсутні параметри конфігурації. Тому необхідно виконати перший запуск в інтерактивному режимі, щоб надати відсутні параметри.

#### Том Docker

**Необхідно зіставити каталог даних додатка з контейнером:**
- `/app/data` — для даних додатка, включаючи конфігурації та деякі інші актуальні дані. Обов’язковий для зіставлення!
Можна зіставити з будь-яким локальним каталогом на хост-системі або томом Docker.

Додатково можна зіставити каталог локалізації з контейнером:
- `/app/locales` — для файлів локалізації, якщо ви хочете використовувати власні повідомлення в чаті Telegram. Опціонально для зіставлення.

#### Перший запуск Docker

Отже, перший запуск повинен виглядати як один з наступних:

- Для роботи як користувач Telegram та інтерактивного встановлення всіх основних параметрів конфігурації:
    ```sh
    docker run -it --name svitlobot-monitor \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        petrovoronov/svitlobot-monitor:latest \
        node src/index.js --language uk --group 2 --refresh-interval 5
    ```

- Для роботи як користувач Telegram та встановлення всіх основних параметрів конфігурації як змінні середовища:
    ```sh
    docker run -d --name svitlobot-monitor \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        -e TELEGRAM_API_ID=your_telegram_api_id \
        -e TELEGRAM_API_HASH=your_telegram_api_hash \
        -e TELEGRAM_CHAT_ID=your_telegram_chat_id \
        -e TELEGRAM_TOPIC_ID=your_telegram_topic_id \
        petrovoronov/svitlobot-monitor:latest \
        node src/index.js --language uk --group 2 --refresh-interval 5
    ```

- Для роботи як бот Telegram та інтерактивного встановлення всіх основних параметрів конфігурації:
    ```sh
    docker run -it --name svitlobot-monitor \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        petrovoronov/svitlobot-monitor:latest \
        node src/index.js --as-bot --language uk --group 2 --refresh-interval 5
    ```

- Для роботи як бот Telegram та встановлення всіх основних параметрів конфігурації як змінні середовища:
    ```sh
    docker run -d --name svitlobot-monitor \
        -v /path/to/your/data:/app/data \
        -v /path/to/your/locales:/app/locales \
        -e TELEGRAM_API_ID=your_telegram_api_id \
        -e TELEGRAM_API_HASH=your_telegram_api_hash \
        -e TELEGRAM_BOT_AUTH_TOKEN=your_telegram_bot_auth_token \
        -e TELEGRAM_CHAT_ID=your_telegram_chat_id \
        -e TELEGRAM_TOPIC_ID=your_telegram_topic_id \
        petrovoronov/svitlobot-monitor:latest \
        node src/index.js --as-bot --language uk --group 2 --refresh-interval 5
    ```
**Важлива примітка: передайте всі пізніше необхідні параметри командного рядка під час першого запуску!**

Після першого запуску додаток збереже параметри конфігурації та додаткову інформацію. Будь ласка, зупиніть контейнер, натиснувши `Ctrl+C`, і перезапустіть його за допомогою команд із наступного розділу.

#### Наступні запуски Docker

Після першого запуску ви можете запускати додаток з тими ж параметрами конфігурації, що і під час попереднього запуску, без додаткових параметрів командного рядка.

Щоб запустити додаток, виконайте наступну команду:

```sh
docker start svitlobot-monitor
```

Щоб зупинити додаток, виконайте наступну команду:

```sh
docker stop svitlobot-monitor
```

### Docker Compose

Щоб запустити додаток за допомогою Docker Compose, створіть файл `docker-compose.yml` з наступним вмістом:

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
        command: node src/index.js --language uk --group 2 --refresh-interval 5
```

Замініть `/path/to/your/data` та `/path/to/your/locales` на реальні шляхи у вашій системі, де ви хочете зберігати дані програми та файли локалізації.

Потім виконайте наступну команду для запуску додатка:

```sh
docker-compose up -d
```

Це запустить додаток як екземпляр бота Telegram із зазначеними параметрами конфігурації.

## Локалізація

Додаток підтримує надсилання сповіщень у Telegram різними мовами. Мова за замовчуванням — англійська (`en`).
Ви можете змінити мову, передавши параметр `--language` з кодом мови у командному рядку.
Ви можете змінювати повідомлення, редагуючи файли локалізації в каталозі `locales`.

### Додавання нової мови

Ви можете додати нову мову, створивши новий файл локалізації в каталозі `locales` з кодом мови як назвою файлу (наприклад, `fr.json` для французької). Потім додайте переклади для повідомлень у новий файл.
```json
{
    "Group %s - switching to on is started": "Groupe %s - commutation en marche est démarrée",
    "Group %s - switching to off is started": "Groupe %s - commutation à l'arrêt est démarrée",
}
```
Потім ви можете передати код мови як значення параметра `--language` у командному рядку, щоб використовувати нову мову.

### Файли локалізації для Docker

У разі використання Docker, ви можете зіставити каталог `locales` з контейнером, щоб використовувати власні файли локалізації для повідомлень у чаті Telegram.
Але в цьому випадку після першого запуску ви отримаєте лише **порожні файли** в відповідному каталозі `locales` на хост-системі. Потім ви можете редагувати/додавати потрібні файли локалізації в каталог `locales` на хост-системі та перезапустити контейнер.

## Ліцензія

Цей проєкт ліцензований за ліцензією MIT — деталі дивіться у файлі [LICENSE](LICENSE).