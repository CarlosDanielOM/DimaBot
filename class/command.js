const commandSchema = require('../schema/command');

class Command {
    async createCommand(channelID, command) {
        let exists = await commandSchema.findOne({channelID, cmd: command.cmd});
        if(exists) {
            return {
                error: true,
                message: 'Command already exists',
                status: 400,
                type: 'command_already_exists'
            }
        }
        let commandData = new commandSchema(command);
        let saved = await commandData.save();
        if(saved.error) {
            return {
                error: true,
                message: "Error saving command",
                status: 500,
                type: "error_saving_command"
            }
        }

        return {
            error: false,
            created: true,
            command: saved
        }
    }

    async deleteCommand(channelID, command) {
        let deleted = await commandSchema.findOne({channelID, cmd: command});
        if(!deleted) {
            return {
                error: true,
                message: 'Command does not exist',
                status: 400,
                type: 'command_does_not_exist'
            }
        }
        try {
            await deleted.deleteOne();
        } catch (error) {
            console
        }
    }

    //? DATABASE METHODS
    async getCommandFromDB(channelID, commandCMD) {
        let command = await commandSchema.findOne({channelID, cmd: commandCMD});
        if(!command) {
            return {
                error: true,
                message: 'Command does not exist',
                status: 400,
                type: 'command_does_not_exist'
            }
        }

        return {
            error: false,
            command
        }
    }
    
    async getReservedCommandFromDB(channelID, commandCMD) {
        let command = await commandSchema.findOne({channelID, cmd: commandCMD, reserved: true});
        if(!command) {
            return {
                error: true,
                message: 'Command does not exist',
                status: 400,
                type: 'command_does_not_exist'
            }
        }

        return {
            error: false,
            command
        }
    }
    
    async checkIfCommandExists(channelID, commandCMD) {
        let command = await commandSchema.findOne({channelID, cmd: commandCMD});
        if(!command) {
            return {
                error: true,
                message: 'Command does not exist',
                status: 400,
                type: 'command_does_not_exist'
            }
        }

        return {
            error: false,
            command
        }
    }

    async checkIfReservedCommandExists(channelID, commandCMD) {
        let command = await commandSchema.findOne({channelID, cmd: commandCMD, reserved: true});
        if(!command) {
            return {
                error: true,
                message: 'Command does not exist',
                status: 400,
                type: 'command_does_not_exist'
            }
        }

        return {
            error: false,
            command
        }
    }

    async updateCommandInDB(channelID, commandCMD, updateData) {
        let command = await commandSchema.findOne({channelID, cmd: commandCMD});
        if(!command) {
            return {
                error: true,
                message: 'Command does not exist',
                status: 400,
                type: 'command_does_not_exist'
            }
        }

        try {
            await command.updateOne(updateData);
        } catch (error) {
            console.log(`Error updating command: ${error} for channelID: ${channelID}`);
            return {
                error: true,
                message: 'Error updating command',
                status: 500,
                type: 'error_updating_command'
            }
        }
        
    }

    async updateCountableCommandInDB(channelID, commandCMD, countData) {
        let command = await commandSchema.findOne({channelID, cmd: commandCMD});
        if(!command) {
            return {
                error: true,
                message: 'Command does not exist',
                status: 400,
                type: 'command_does_not_exist'
            }
        }

        try {
            await command.updateOne({count: countData});
        } catch (error) {
            console.log(`Error updating command: ${error} for channelID: ${channelID}`);
            return {
                error: true,
                message: 'Error updating command',
                status: 500,
                type: 'error_updating_command'
            }
        }
        
    }

    async updateCommandAvailability(channelID, commandCMD, availability) {
        let command = await commandSchema.findOne({channelID, cmd: commandCMD});
        if(!command) {
            return {
                error: true,
                message: 'Command does not exist',
                status: 400,
                type: 'command_does_not_exist'
            }
        }

        try {
            await command.updateOne({enabled: availability});
        } catch (error) {
            console.log(`Error updating command: ${error} for channelID: ${channelID}`);
            return {
                error: true,
                message: 'Error updating command',
                status: 500,
                type: 'error_updating_command'
            }
        }
    }
    
}

module.exports = new Command();