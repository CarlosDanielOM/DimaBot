const ban = require("../function/moderation/ban");
const addVIPCommand = require("./addvip");

async function miyuloot(channelID, tags) {

    let prizes = [
        'Insulto', 'besito', 'VIP', '1 Cofre', 'IRL rana', 'Timeout 15m', '10 Cofres', 'Miyu  Arriesgada'
    ];

    let weights = [
        .66, .21, .024, .005, .0005, .10, .0000005, .0001
    ]

    let insultos = [
        'Jaja que pendejo, no gano nada el baboso',
        'Jaja, mejor suerte la proxima, pendejo',
        'Tu suerte es tan mala que ni la botarga de rana te quiere.',
        'Con esa suerte que tienes, compras la loteria y terminas perdiendo hasta tu casa',
        'Alguien intento ganar algo hoy y gano pura verga :)',
        'Felicidades, acabas de ganar pura verga',
        'Denle aplausos al pendejo que gano puro aire, a ver si con eso comes',
        'Y tu premio es valer verga, no te preocupes, es pura verga',
    ]

    let prize = weightedRandom(prizes, weights);

    let message = null;

    switch(prize) {
        case 'Insulto':
            message = insultos[Math.floor(Math.random() * insultos.length)];
            break;
        case 'besito':
            message = `${tags['display-name']} ganó el besito!`;
            break;
        case 'VIP':
            message = `${tags['display-name']} ganó el VIP por un stream!`;
            await addVIPCommand(channelID, `${tags['username']} 1`, tags);
            break;
        case '1 Cofre':
            message = `${tags['display-name']} ganó 1 Cofre de StreamLoots!`;
            break;
        case 'IRL rana':
            message = `${tags['display-name']} ganó IRL rana asi que Miyu no sea floja y pongasela!`;
            break;
        case 'Timeout 15m':
            message = `${tags['display-name']} ganó Timeout 15m, alli nos vemos!`;
            await ban(channelID, tags['user-id'], 698614112, 15 * 60 * 1000, 'Miyu Loot');
            break;
        case '10 Cofres':
            message = `${tags['display-name']} ganó 10 Cofres de StreamLoots!`;
            break;
        case 'Miyu  Arriesgada':
            prize = 'Miyu  Arriesgada';
            message = `Miyu ${tags['display-name']} ganó la miyu arriesgada!`;
            break;
    }

    return {
        error: false,
        message: message,
        status: 200,
        type: 'Miyu'
    }
}

module.exports = miyuloot;

function weightedRandom(array, weights) {
    let total = 0;
    for (let i = 0; i < weights.length; i++) {
        total += weights[i];
    }
    let r = Math.random() * total;
    for (let i = 0; i < weights.length; i++) {
        if (r < weights[i]) {
            return array[i];
        }
        r -= weights[i];
    }
}