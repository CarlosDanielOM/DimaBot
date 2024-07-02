const {getUrl} = require('../util/dev')
const sumimetroSchema = require('../schemas/sumimetro')

class Sumimetro {
    constructor() {
        this.sumimetro = new Map();
        this.sumisoSupremo = {}
        this.dominanteSupremo = {}

        this.sumiso = 0;
        this.dominante = 0;
        this.message = null;

        this.url = null;
        this.channel = null;
        
        this.date = null;
    }

    init(channel) {
        this.channel = channel;
        this.url = getUrl(channel);
    }

    reset() {
        this.sumimetro.clear();
        this.sumisoSupremo = {};
        this.dominanteSupremo = {};

        this.sumiso = 0;
        this.dominante = 0;
        this.message = null;

        this.date = null;
    }

    //? GET METHODS

    getSumimetros() {
        return this.sumimetro;
    }

    getSumimetro(user) {
        return this.sumimetro.get(user);
    }

    getSumiso() {
        return this.sumiso;
    }

    getDominante() {
        return this.dominante;
    }

    getMessage() {
        return this.message;
    }

    getSumimoSupremo() {
        return this.sumisoSupremo;
    }

    getDominanteSupremo() {
        return this.dominanteSupremo;
    }

    getDateString() {
        return this.date.toLocaleString();
    }

    //? HAS METHODS

    hasSumimetro(user) {
        return this.sumimetro.has(user);
    }

    hasSumimetroSupremo() {
        return Object.hasOwn(this.sumisoSupremo, 'user');
    }

    hasDominanteSupremo() {
        return Object.hasOwn(this.dominanteSupremo, 'user');
    }

    //? SET METHODS

    setSumimetro(user, sumimetro) {
        this.sumimetro.set(user, sumimetro);
        this.sumiso = sumimetro.sumiso;
        this.dominante = sumimetro.dominante;
    }
    
    setSumisoSupremo(user, sumimetro) {
        this.sumisoSupremo = {
            user: user,
            sumiso: this.sumiso
        }
    }

    setDominanteSupremo(user, sumimetro) {
        this.dominanteSupremo = {
            user: user,
            dominante: this.dominante
        }
    }

    setDateString(dateString) {
        this.date = dateString;
    }

    getSumimetroFromDB = getSumimetroFromDB;
    
}

module.exports = Sumimetro;

async function getSumimetroFromDB(user, date) {
    const sumimetro = await sumimetroSchema.findOne({channel: this.channell, username: user}).sort({timestamp: -1});
    if(!sumimetro) return null;
    let sumiDate = sumimetro.date.day + '/' + sumimetro.date.month + '/' + sumimetro.date.year;
    if(sumiDate !== date) return null;
    let newSumiData = {
        sumiso: sumimetro.submissive,
        dominante: sumimetro.dominant
    }
    user = user.toLowerCase();
    await this.setSumimetro(user, newSumiData);
    return true;
}