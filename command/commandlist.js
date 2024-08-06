const commandSchema = require('../schema/command')

async function getCommandList(channelID, userLevel = 1, type = 'all') {
    let commands = await commandSchema.find({channelID, enabled: true});

    if(!commands) {
        return {
            error: true,
            message: 'No commands found'
        }
    }
    
    commands = commands.map(command => {
        if(command.type == 'timer' || command.userLevel >= userLevel) return;
        if(command.type !== 'timer' && command.userLevel <= userLevel) return command.cmd;
    })

    commands = commands.filter(command => command !== undefined);

    return {
        error: false,
        message: `List of commands available are: ${commands.join(', ')}`
    }
    
}

module.exports = getCommandList;