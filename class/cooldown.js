class COOLDOWN {
    constructor() {
        this.cooldowns = new Map();
    }

    setCooldown(id, time) {
        this.cooldowns.set(id, time);
        setTimeout(() => {
            this.cooldowns.delete(id);
        }, time * 1000);
    }

    getCooldown(id) {
        return this.cooldowns.get(id);
    }

    hasCooldown(id) {
        return this.cooldowns.has(id);
    }

    deleteCooldown(id) {
        this.cooldowns.delete(id);
    }

    clearCooldowns() {
        this.cooldowns.clear();
    }

    getCooldowns() {
        return this.cooldowns;
    }
    
}

module.exports = COOLDOWN;