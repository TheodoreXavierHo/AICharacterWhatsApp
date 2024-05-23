// Import axios library, qrcode, and whatsapp-web.js packages
const qrcode = require('qrcode-terminal');
const { Client, LocalAuth } = require('whatsapp-web.js');
const axios = require('axios');

// Server address
const server = "127.0.0.1";

// Generation parameters
const params = {
    max_new_tokens: 200,
    do_sample: true,
    temperature: 0.5,
    top_p: 0.9,
    typical_p: 1,
    repetition_penalty: 1.05,
    encoder_repetition_penalty: 1.0,
    top_k: 0,
    min_length: 0,
    no_repeat_ngram_size: 0,
    num_beams: 1,
    penalty_alpha: 0,
    length_penalty: 1,
    early_stopping: false
};

// Create a new client instance with LocalAuth strategy
const client = new Client({
  authStrategy: new LocalAuth(),
});

// Listen to 'qr' event to generate and display QR code for authentication
client.on('qr', qr => {
  qrcode.generate(qr, {small: true});
});

// Listen to 'ready' event
client.on('ready', async () => {
  console.log('Client is ready!');
});

// Declare variables to store user messages and a timeout ID
let userMessages = [];
let timeoutId;

// Listen to 'message' event to handle incoming messages
client.on('message', async message => {
  // Create a chatting instance with getChat
  const chating = await message.getChat();

  // Get Reciver's Phone Number
  const phoneNumber = await message.getContact();

  // Set Seen Message status
  chating.sendSeen();

  // Check if phone number is from the user
  if (phoneNumber.number === "6590253245") {
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

      // Send a POST request with the combined user message and parameters
      axios.post(`http://${server}:7860/run/textgen`, {
        data:[
            combinedMessage,
            params.max_new_tokens,
            params.do_sample,
            params.temperature,
            params.top_p,
            params.typical_p,
            params.repetition_penalty,
            params.encoder_repetition_penalty,
            params.top_k,
            params.min_length,
            params.no_repeat_ngram_size, 
            params.num_beams, 
            params.penalty_alpha, 
            params.length_penalty, 
            params.early_stopping
        ]
      })
      .then(function (response) {
        // Handle success
        console.log(response.data.data[0]); // Print the generated reply
        
        // Adds a new line to the message when there is a punctuation followed by a single blank space
        const editedResponse = response.data.data[0].replace(/([.?!]) /g, "$1\n");
        
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
          }
        } 
      })
      .catch(function (error) {
        // Handle error
        console.log(error); // Print the error message
      });
     
      // Clear the list of user messages and the timeout ID
      userMessages = [];
      timeoutId = null;
    }, 15000); // Delay the reponse by 15000 milliseconds (15 seconds)
  }
});

// Initialize the client
client.initialize();
