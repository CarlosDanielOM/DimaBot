async function pechos(channelID, tags) {
    const copas = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

    let talla = Math.floor(Math.random() * copas.length);

    let pecho = copas[talla];

    let message = `@${tags['display-name']} tiene pechos de copa ${pecho} `;

    switch (talla) {
        case 0:
            message += `Miren tremenda tablita!`;
            break;
        case 1:
            message += `Miren una tabla normalita!`;
            break;
        case 2:
            message += `Un tamaño decente, nada mal.`;
            break;
        case 3:
            message += `Ya estan antojando!`;
            break;
        case 4:
            message += `Epale, que grandes!`;
            break;
        case 5:
            message += `Damn, esos melones son de otro planeta!`;
            break;
        case 6:
            message += `Pero que tremendo MAGUMBOSSSSS!`;
            break;
    }
    
    return {
        message
    };
    
}

module.exports = pechos;