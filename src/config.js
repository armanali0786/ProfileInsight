
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

export const URL = {
    BASE_URL : API_BASE_URL
}

export const LinkedInApi = {
    clientId: '78d5sixenkh6yd',
    redirectUri:`https://${chrome.runtime.id}.chromiumapp.org/linkedin-callback`,
    oauthUrl: 'https://www.linkedin.com/oauth/v2/authorization?response_type=code',
    scope: 'r_liteprofile%20r_emailaddress',
    state: '987654321'
};


export const AuthData = {
   token: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoiZGV2IiwibmFtZSI6IiIsIkFQSV9USU1FIjoxNzMyMzM2NTY3fQ.Dr8ZaBGhXfBqoQQecV2G-Kv-pENc7hN6ISdDDrdYe_Y',
};
