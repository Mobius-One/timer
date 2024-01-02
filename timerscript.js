const BACKEND_URL = "https://poketwitch.bframework.de/";
const ONE_SECOND = 1000;

function padZero(value, length) {
    return String(value).padStart(length, '0');
}

function handleSpawnTime(data) {
    const next_spawn = data.next_spawn;
    const futureTime = new Date(Date.now() + next_spawn * ONE_SECOND);

    console.log(`${padZero(futureTime.getHours(), 2)}:${padZero(futureTime.getMinutes(), 2)}:${padZero(futureTime.getSeconds(), 2)}`);

    startCooldown(next_spawn);
}

function startCooldown(next_spawn) {
    if (next_spawn > 0) {
        updateCountdown(next_spawn);
        setTimeout(() => startCooldown(next_spawn - 1), ONE_SECOND);
    } else if (next_spawn === 60) {
        setTimeout(mainloop, ONE_SECOND);
    } else {
        const audio = new Audio("audio.mp3");
        audio.play().catch(error => {
        console.log(`Error playing the audio: ${error}`);
    });
        setTimeout(mainloop, 2 * ONE_SECOND);
    }
}

function updateCountdown(next_spawn) {
    const minutes = Math.floor(next_spawn / 60);
    const seconds = next_spawn % 60;
    document.getElementById('countdown').textContent = `${padZero(minutes, 2)}:${padZero(seconds, 2)}`;
}


function mainloop() {
    fetch(BACKEND_URL + 'info/events/last_spawn/')
        .then(response => {
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.status} ${response.statusText}`);
            }
            return response.json();
        })
        .then(handleSpawnTime)
        .catch(error => {
            console.error('There was a problem with the fetch operation:', error.message);
            setTimeout(mainloop, ONE_SECOND);
        });
}

mainloop();