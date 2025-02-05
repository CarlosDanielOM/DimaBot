async function miyuloot(channelID, tags) {

    let prizes = [
        'Insulto', 'besito', 'VIP', '1 Cofre', 'IRL rana', 'Timeout 15m', '10 Cofres', 'Miyu  Arriesgada'
    ];

    let weights = [
        .66, .21, .024, .005, .0005, .10, .0000005, .0001
    ]

    let prize = weightedRandom(prizes, weights);

    return {
        error: false,
        message: `Miyu ${tags['display-name']} ganó el ${prize}!`,
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