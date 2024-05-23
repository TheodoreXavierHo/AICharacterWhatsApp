// Import CharacterAI, qrcode, and whatsapp-web.js packages
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const CharacterAI = require('node_characterai');

// Create a new client instance with LocalAuth strategy
const client = new Client({
  authStrategy: new LocalAuth(),
});

// Create a new instance of CharacterAI
const characterAI = new CharacterAI();

// Set token and character ID
const tokenId = "TOKEN"
const characterId = "CHARACTERID"

// Listen to 'qr' event to generate and display QR code for authentication
client.on('qr', qr => {
  qrcode.generate(qr, {small: true});
});

// Declare chat varaible
let chat;

// Listen to 'ready' event to authenticate with CharacterAI and create or continue a chat session
client.on('ready', async () => {
  console.log('Client is ready!');
  
  // Authenticate with CharacterAI using the token
  await characterAI.authenticateWithToken(tokenId);

  // Create a new chat session with the given character ID
  chat = await characterAI.createOrContinueChat(characterId);
  
   // Fetch user information and store the username
  const userDetail = await characterAI.fetchUser(); 
  const username = userDetail.user.name;

  // Fetch character information and store the character name
  const characterDetails = await characterAI.fetchCharacterInfo(characterId);
  const charactername = characterDetails.name;

  // Fetch chat history and store the messages and names in arrays
  const fetchHistory = await chat.fetchHistory();
  const messages = fetchHistory.messages;
  const messageValues = [];
  const nameValues = [];

  // Adds each message into a list of messages
  for (let i = 0; i < messages.length; i++) {
    messageValues.push(messages[i].text);
    nameValues.push(messages[i].src__name);
  }

  // Loop through the messages and display them on the console
  let number = 0;
  while (messageValues[number]) {
    if(nameValues[number] === username) {
      // Display user reponse message to the terminal
      console.log(`\n${username}: ${messageValues[number]}\n`);
    }
    else {
      // Display character reponse message to the terminal
      console.log(`\n${charactername}: ${messageValues[number]}\n`);
    }
    number++;
  };
});

// Declare variables to store user messages and a timeout ID
let userMessages = [];
let timeoutId;

// Listen to 'message' event to handle incoming messages
client.on('message', async message => {
  // Get Username
  const userDetail = await characterAI.fetchUser();
  const username = userDetail.user.name;

  // Get Character Name
  const characterDetails = await characterAI.fetchCharacterInfo(characterId);
  const charactername = characterDetails.name;

  // Display user reponse message to the terminal
  console.log(`${username}: ${message.body}\n`);

  // Create a chatting instance with getChat
  const chating = await message.getChat();

  // Get Reciver's Phone Number
  const phoneNumber = await message.getContact();

  // Set Seen Message status
  chating.sendSeen();

  // Check if phone number is from the user
  if (phoneNumber.number === "6512345678") {
    // If the message is 'ping', respond with 'Pong!', This is use to check if the whatsapp is working
    if (message.body.toLowerCase() === 'ping') {
      // Simulates typing in the chat
      chating.sendStateTyping();

      // Send 'Pong!' message to the user
      client.sendMessage(message.from, 'Pong!');
      
      // Display character response message to the terminal
      console.log(`${charactername}: Pong!`);
    } else {
      // Add the user's message to the list of user messages
      userMessages.push(message.body);

      // If there is an existing timeout, clear it
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      // Set a new timeout to wait for 10 seconds before sending the user messages to CharacterAI
      timeoutId = setTimeout(async () => {
        // Simulates typing in the chat
        chating.sendStateTyping();

        // Combine the user messages with a new line separator
        const combinedMessage = userMessages.join('\n\n');
        
        // Send the combined user message to CharacterAI and wait for response
        const response = await chat.sendAndAwaitResponse(combinedMessage, true);
        
        // Adds a new line to the message when there is a punctuation followed by a single blank space
        const editedResponse = response.text.replace(/([.?!]) /g, "$1\n");
        
        // Split response into multiple messages if it contains newlines
        const responseMessages = editedResponse.split('\n');

        // Send each response message as a separate WhatsApp message
        for (let i = 0; i < responseMessages.length; i++) {
          let trimmedResponse = responseMessages[i].trim();
          if (trimmedResponse !== '') {
            // Remove newline character at the beginning of response message
            trimmedResponse = trimmedResponse.replace(/^\n+/, '');
            
            // Send the response message
            client.sendMessage(message.from, trimmedResponse);
        
            // Display character response message to the terminal
            console.log(`${charactername}: ${trimmedResponse}\n`);
          }
        }      
        // Clear the list of user messages and the timeout ID
        userMessages = [];
        timeoutId = null;
      }, 15000); // Delay the reponse by 15000 milliseconds (15 seconds)
    }
  }
});

// Initialize the client
client.initialize();

/* Unused feature.
  // Simulates typing in the chat
  chating.sendStateTyping();

  // Calculate delay time based on length of trimmed response message
  // Minimum delay time of 7 seconds
  const delayTime = Math.max(trimmedResponse.length * 30, 7000);

  // Delay sending the message by the calculated delay time
  setTimeout(() => {
    // Send the response message
    client.sendMessage(message.from, trimmedResponse);

    // Display character response message to the terminal
    console.log(`${charactername}: ${trimmedResponse}\n`);
  }, delayTime);
*/
