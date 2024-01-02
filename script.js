let user = ""
const cmds = [
    { "cmd": ["!lurk\r\n"], "res": ["Ok @${user}, have a good lurk!", "Enjoy lurking @${user}!", "Got it @${user}! Lurk away!"] },
    { "cmd": ["!unlurk\r\n"], "res": ["Welcome back @${user}!", "Glad your back @${user}!", "@${user}, lurk mode deactivated!"] },
    { "cmd": ["!scene\r\n", "!scenes\r\n"], "res": [`Hey @${localStorage.getItem('cName')}! Change the scene back to the game!`] },
    { "cmd": ["!mods\r\n", "!mod\r\n"], "res": [`@${user}, I have no idea what mods ${localStorage.getItem('cName')} is using, but it's a lot.`] }
];

//Get a random response for the user
function getRandomResponse(cmd, user, cName) {
    // Iterate over the cmds array
    for (let i = 0; i < cmds.length; i++) {
        // Check if cmd exists in the cmd property of each object
        if (cmds[i].cmd.includes(cmd)) {
            //Check if category is euro truck
            if ((cmd === "!mods\r\n" || cmd === "!mod\r\n")) {
                const url = `https://api.twitch.tv/helix/streams?user_login=${cName}`;
                fetch(url, {
                    method: 'GET',
                    headers: {
                      'Client-ID': 'zc1vjuxzqm44u7d1kcn1rwaamodaio',
                      'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                  })
                  .then(response => response.json())
                  .then(data => {
                    if (data.data && data.data.length > 0) {
                        const streamCategory = data.data[0].game_name;
                        if (streamCategory === "Euro Truck Simulator 2") {
                            const randomIndex = Math.floor(Math.random() * cmds[i].res.length);
                            return cmds[i].res[randomIndex].replace('${user}', user);
                        }
                    }
                  })
                  .catch(error => {
                    return ""
                  });
                return ""
            }

            // Randomly select a response
            const randomIndex = Math.floor(Math.random() * cmds[i].res.length);
            // Replace ${user} with the provided user parameter
            return cmds[i].res[randomIndex].replace('${user}', user);
        }
    }
    // Return an empty string if no matches found
    return "";
}

document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('form');
    let socket;
    let isConnected = false;
    let token;
    let cName;

    function connectWebSocket() {
        token = localStorage.getItem('token');
        cName = localStorage.getItem('cName');  

        if (cName == null || token == null) {
            console.log("No username or token found. Returning...");
            return;
        }

        socket = new WebSocket('wss://irc-ws.chat.twitch.tv:443');

        socket.addEventListener('open', function (event) {
            socket.send('PASS oauth:' + token);
            socket.send('NICK devthatdoesntbot');
            socket.send(`JOIN #${cName}`);

            //Chat check-in message
            //socket.send(`PRIVMSG #${cName} :B)`);

            const statusIndicator = document.getElementById('statusIndicator');
            statusIndicator.classList.remove('disconnected');
            statusIndicator.classList.add('connected');
            isConnected = true;
        });

        socket.addEventListener('message', function (event) {
            const data = event.data;
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}]: ${data}`);
            //Keep connection alive with ping pong
            if (data.includes("PING :tmi.twitch.tv")) {
                socket.send("PONG :tmi.twitch.tv");
            }
            //Specific bot message of interest
            //If data begins with :pokemoncommunitygame!pokemoncommunitygame@pokemoncommunitygame.tmi.twitch.tv
            else if (data.startsWith(":pokemoncommunitygame!pokemoncommunitygame@pokemoncommunitygame.tmi.twitch.tv")) {
                const parts = data.split(':');
                const userMessage = parts[2];
                if (userMessage == undefined) {
                    console.log("Not an user message. Returning.")
                }
                if (userMessage.includes("escaped. No one caught it")) {
                    console.log("log Playing fail")
                    playAudio('fail.mp3');
                } else if (userMessage.includes("has been caught by")) {
                    console.log("log Playing success")
                    playAudio('success.mp3');
                }
            }
            //Stream exclusive commands if needed
            if (data.includes(`:${cName.toLowerCase()}!${cName.toLowerCase()}@${cName.toLowerCase()}.tmi.twitch.tv`)) {
                const parts = data.split(':');
                const userMessage = parts[2];
                if (userMessage.includes("beep")) {
                    socket.send(`PRIVMSG #${cName.toLowerCase()} :boop :p`);
                }
            }
            //General chat messages
            if (data.indexOf(".tmi.twitch.tv") < data.indexOf(" ")) {
                const parts = data.split(':');
                const userMessage = parts[2];
                if (userMessage == undefined) {
                    console.log("Not an user message. Returning.")
                }
                else {
                    //Check if message exists in the list of commands, select one from the array and send.
                    const user_parts = parts[1].split('!')
                    if (parts.length > 1) {
                        user = user_parts[0];
                    }
                    const response = getRandomResponse(userMessage, user, cName)
                    if (response === "") {
                        return
                    }
                    socket.send(`PRIVMSG #${cName} :${response}`);
                }
            }
        });

        socket.addEventListener('close', function (event) {
            const timestamp = new Date().toLocaleTimeString();
            console.log(`[${timestamp}]: Chat connection lost. Attempting reconnection in 5 seconds...`);

            const statusIndicator = document.getElementById('statusIndicator');
            statusIndicator.classList.remove('connected');
            statusIndicator.classList.add('disconnected');
            isConnected = false;

            setTimeout(connectWebSocket, 5000);
        });
    }

    connectWebSocket();

    form.addEventListener('submit', function (event) {
        const fToken = document.getElementById('accessToken').value;
        const fcName = document.getElementById('channelName').value;
        form.reset();
        localStorage.setItem('token', fToken);
        localStorage.setItem('cName', fcName);

        event.preventDefault();
        connectWebSocket();
        displayIndicator();
    });

    const resetButton = document.getElementById('wipe');
    resetButton.addEventListener('click', function (event) {
        if (socket) {
            socket.close();
        }
        localStorage.removeItem('token');
        localStorage.removeItem('cName');
        form.reset();
        displayIndicator();
    });

});

function playAudio(audioFile) {
    const audio = new Audio(audioFile);
    audio.play().catch(error => {
        console.log(`Error playing the audio: ${error}`);
    });
}

function displayIndicator() {
    const statusIndicator = document.getElementById('statusIndicator');
    statusIndicator.classList.remove('connected', 'disconnected');
    statusIndicator.classList.add('disconnected');
}