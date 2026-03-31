const axios = require('axios');
const cheerio = require('cheerio');

async function test(url) {
    try {
        console.log('Fetching:', url);
        // Follow redirect
        const initialRes = await axios.get(url, {
            headers: { 'User-Agent': 'curl/7.68.0' } // simple agent
        });
        
        const redirectUrl = initialRes.request.res.responseUrl;
        const match = redirectUrl.match(/activities\/(\d+)/);
        if (!match) return console.log('No ID found');
        
        const activityId = match[1];
        
        // Use OEmbed
        const oembedUrl = `https://www.strava.com/api/v3/oembed?url=https://www.strava.com/activities/${activityId}`;
        console.log('Fetching OEmbed:', oembedUrl);
        
        const oembedRes = await axios.get(oembedUrl);
        console.log('OEmbed response:', oembedRes.data);
        
        // OEmbed returns an 'html' string that has the embed card. 
        // We can cheerio that card to get distance/time/pace
        const html = oembedRes.data.html;
        const $ = cheerio.load(html);
        
        const stats = [];
        $('.stat-value').each((i, el) => {
            stats.push($(el).text().trim());
        });
        
        console.log('Extracted Stats from Embed:', stats);

    } catch(err) {
        console.error('Error fetching:', err.message);
    }
}

test('https://strava.app.link/iX1muTY7p1b');
