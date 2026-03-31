const axios = require('axios');
const cheerio = require('cheerio');

async function test(url) {
    try {
        console.log('Fetching:', url);
        // Follow redirect
        const initialRes = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/115.0.0.0 Safari/537.36' }
        });
        
        const redirectUrl = initialRes.request.res.responseUrl;
        console.log('Redirect URL:', redirectUrl);
        
        const match = redirectUrl.match(/activities\/(\d+)/);
        if (!match) {
            console.log('No ID found in the redirect link.');
            return;
        }
        
        const activityId = match[1];
        const fetchUrl = `https://www.strava.com/activities/${activityId}`;
        console.log('Final Activity URL:', fetchUrl);
        
        const finalRes = await axios.get(fetchUrl, {
            headers: { 
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36' 
            }
        });
        
        const $ = cheerio.load(finalRes.data);
        const ogTitle = $('meta[property="og:title"]').attr('content');
        const ogDesc = $('meta[property="og:description"]').attr('content') || '';
        
        console.log('--- Extracted Meta Info ---');
        console.log('OG Title:', ogTitle);
        console.log('OG Desc:', ogDesc);
        
        // Emulate our server logic
        const distMatch = ogDesc.match(/([\d.,]+)\s*(km|mi)/i);
        if (distMatch) {
            console.log('==> Distance Found:', distMatch[1], distMatch[2]);
        } else {
            console.log('==> No Distance Found (Activity might be private or followers only).');
        }

    } catch(err) {
        console.error('Error fetching:', err.message);
    }
}

test('https://strava.app.link/aqDLvqJ6W1b');
