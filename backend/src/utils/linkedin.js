const axios = require('axios');

async function exchangeCodeForToken(code) {
  const params = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.LINKEDIN_REDIRECT_URI,
    client_id: process.env.LINKEDIN_CLIENT_ID,
    client_secret: process.env.LINKEDIN_CLIENT_SECRET,
  });

  const { data } = await axios.post(
    'https://www.linkedin.com/oauth/v2/accessToken',
    params.toString(),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  return data.access_token;
}

async function fetchUserInfo(accessToken) {
  const { data } = await axios.get('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  return data; // { sub, email, email_verified, given_name, family_name, name, locale, picture }
}

module.exports = { exchangeCodeForToken, fetchUserInfo };
