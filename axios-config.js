const axios = require('axios');
const xml = require('xml2js');
const promisify = require('util').promisify;

module.exports = () => {
    // Configure parsing of XML responses to JSON
    axios.interceptors.response.use(
        async response => {
            const contentType = response.headers['content-type'];
            const xmlParser = new xml.Parser({ explicitArray: false });

            if (contentType && contentType.includes('text/xml')){
                response.data = await promisify(xmlParser.parseString)(response.data);
                response.headers['content-type'] = 'application/json';
            }

            return response;
        }
    );
}
