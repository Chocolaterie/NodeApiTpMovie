
module.exports = {

    /**
     * Construit la données JS d'une réponse métier
     * @param {*} _code 
     * @param {*} _message 
     * @param {*} _data 
     * @returns 
     */
    buildResponseJson(_code, _message, _data) {
        return { code : _code, message : _message, data : _data };
    },

    /**
     * Retourne une réponse json avec la données JS d'une réponse métier
     * @param {*} response 
     * @param {*} _code 
     * @param {*} _message 
     * @param {*} _data 
     * @returns 
     */
    buildResponse(response, _code, _message, _data) {
        return response.json(this.buildResponseJson(_code, _message, _data));
    }
};