# Transaction Service

## Rules

- Create a web service.
- Internally the service keeps track of a "User" object that has one parameter -- "balance". You can store that data in any way you like.
- Every user starts with a balance of 1000.
- Service has an websocket endpoint "/transact".
- It accepts the following object {"user": <user_id>, "amount": <number>}.
    - If amount is negative, it will subtract the amount from user's balance
    - If amount is positive, it will add to user's balance
    - Handle all error cases (e.g. balance cannot go below zero)
- Websocket responds with the latest {"user", "amount"} object.
- Create a Telegram bot.
- The bot has two buttons "Add", "Subtract".
- Clicking any of the buttons will ask user to specify the amount.
- The amount will be sent to the websocket endpoint.
- The bot needs to handle socket response (i.e. message reads) and output the result in a human readable way.