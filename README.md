# Starter-V2.5

Starter-V2.5 BOT is a versatile Telegram bot project which is built upon its predecessor, [Starter-V1](https://github.com/SatoX69/Starter-V1)

## Features

- **Respond to Command Initialization**: The bot listens and responds to messages starting with a slash (/) and notifies the user if it's a valid command.
- **No External Services or Third-party APIs**: The project uses only first-party modules, resulting in lower latency.
- **Database Integration**: The bot integrates with both SQLite and MongoDB, using them efficiently.

## Installation and Setup

### Prerequisites
- Bot Account Token

### Installation

1. **Clone the Repository**:
   ```sh
   git clone https://github.com/SatoX69/Starter-V2.5
   cd Bot
   ```

2. **Install Dependencies**:
   ```sh
   npm install 
   ```

3. **Configure the Bot**:
   - Review the `config.json` file.
   - Review the `config_handler.json` file

### Running the Bot

  ```sh
  npm run start
  ```

## Usage

To interact with the bot, users must initiate a command to add themselves to the bot's database.

# Help List
- `/help` - Displays a list of available commands and their descriptions.

## Author(s)

- **SatoX69** (Lead Author):
  - [GitHub](https://github.com/SatoX69)
  - [Telegram](https://t.me/Jsusbin)

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.