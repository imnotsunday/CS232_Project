const axios = require('axios');
const jwt = require('jsonwebtoken');

const TU_AUTH_API = 'https://restapi.tu.ac.th/api/v1/auth/Ad/verify2';
const APPLICATION_KEY = process.env.TU_APP_KEY; // เก็บใน Lambda environment variables
const JWT_SECRET = process.env.JWT_SECRET;     // ใช้เซ็น JWT

exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body);
    const { username, password } = body;

    if (!username || !password) {
      return response(400, { message: 'Username and password are required' });
    }

    const result = await axios.post(TU_AUTH_API, {
      UserName: username,
      PassWord: password,
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Application-Key': APPLICATION_KEY,
      },
    });

    if (!result.data || !result.data.displayname_en) {
      return response(401, { message: 'Invalid TU credentials' });
    }

    const token = jwt.sign(
      {
        userId: username,
        name: result.data.displayname_en,
        role: 'student',
      },
      JWT_SECRET,
      { expiresIn: '2h' }
    );

    return response(200, { token });

  } catch (error) {
    console.error(error);
    return response(500, { message: 'Login error', error: error.message });
  }
};

function response(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': '*',
    },
    body: JSON.stringify(body),
  };
}
